import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Owner-facing — includes payout details. Only ever returned to an
// authenticated request that proved ownership.
export type Business = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  payout_method: string;
  mpesa_shortcode: string | null;
  payout_phone: string | null;
  created_at: string;
};

// What the public /book/[slug] page gets — deliberately narrower.
export type BusinessPublic = {
  id: string;
  name: string;
  slug: string;
};

export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_kes: number;
  deposit_kes: number;
  active: boolean;
};

export type AvailabilityRule = {
  id: string;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start_time: string;
  end_time: string;
};

export type Booking = {
  id: string;
  status: string;
  slot_start: string;
  slot_end: string;
  customer_name: string;
  mpesa_receipt_number: string | null;
};

export type AvailabilityResponse = {
  date: string;
  service_id: string;
  slots: string[];
};

export type Owner = {
  id: string;
  email: string;
  created_at: string;
};

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface ValidationErrorDetail {
	msg: string;
	loc?: (string | number)[];
	type?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : Array.isArray(body.detail)
        ? body.detail.map((d: ValidationErrorDetail) => d.msg).join("; ")
        : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // --- Auth ---
  signup: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<Owner>("/auth/me"),

  // --- Business onboarding (owner, requires auth) ---
  createBusiness: (payload: {
    name: string;
    phone: string;
    slug: string;
    payout_method: "phone" | "shortcode";
    payout_phone?: string;
    mpesa_shortcode?: string;
  }) => request<Business>("/businesses", { method: "POST", body: JSON.stringify(payload) }),

  listMyBusinesses: () => request<Business[]>("/businesses/mine"),

  // --- Business (public) ---
  getBusinessBySlug: (slug: string) => request<BusinessPublic>(`/businesses/${slug}`),

  // --- Services ---
  createService: (
    businessId: string,
    payload: { name: string; duration_minutes: number; price_kes: number; deposit_kes: number }
  ) =>
    request<Service>(`/businesses/${businessId}/services`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listServices: (businessId: string) => request<Service[]>(`/businesses/${businessId}/services`),

  // --- Availability rules (owner mutates, public reads) ---
  createAvailabilityRule: (
    businessId: string,
    payload: { day_of_week: number; start_time: string; end_time: string }
  ) =>
    request<AvailabilityRule>(`/businesses/${businessId}/availability-rules`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listAvailabilityRules: (businessId: string) =>
    request<AvailabilityRule[]>(`/businesses/${businessId}/availability-rules`),

  deleteAvailabilityRule: (businessId: string, ruleId: string) =>
    request<void>(`/businesses/${businessId}/availability-rules/${ruleId}`, { method: "DELETE" }),

  // --- Computed open slots (public) ---
  getAvailability: (businessId: string, serviceId: string, date: string) =>
    request<AvailabilityResponse>(
      `/businesses/${businessId}/availability?service_id=${serviceId}&date=${date}`
    ),

  // --- Bookings (create/poll public, everything else owner-only) ---
  createBooking: (
    businessId: string,
    payload: { service_id: string; customer_name: string; customer_phone: string; slot_start: string }
  ) =>
    request<Booking>(`/businesses/${businessId}/bookings`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getBookingStatus: (businessId: string, bookingId: string) =>
    request<Booking>(`/businesses/${businessId}/bookings/${bookingId}/status`),

  checkPayment: (businessId: string, bookingId: string) =>
    request<Booking>(`/businesses/${businessId}/bookings/${bookingId}/check-payment`, {
      method: "POST",
    }),

  listBookings: (businessId: string) => request<Booking[]>(`/businesses/${businessId}/bookings`),
};

export { ApiError };

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
