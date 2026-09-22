const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

export type Service = {
	id: string;
	name: string;
	duration_minutes: number;
	price_kes: number;
	deposit_kes: number;
	active: boolean;
}

export type AvailabilityRule = {
	id: string;
	day_of_week: number;
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
}

export type AvailabilityResponse = {
	date: string;
	service_id: string;
	slots: string[];
}

class ApiError extends Error {
	constructor(message: string, public status: number) {
		super(message);
	}
}


async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: {"Content-Type": "application/json"},
		...options,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const detail = typeof body.detail === 'string'
			? body.detail
			: Array.isArray(body.detail)
			? body.detail.map((d: any) => d.msg).join(";")
			: `Request failed (${res.status})`
		throw new ApiError(detail, res.status);
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

export const api = {
	//business onboarding
	createBusiness: (payload: {
		name: string;
		phone: string;
		slug: string;
		payout_method: "phone" | "shortcode";
		payout_phone?: string;
		mpesa_shortcode?: string;
	}) => request<Business>("/business", { method: "POST", body: JSON.stringify(payload)}),
	getBusinessSlug: (slug: string) => request<Business>(`/businesses/${slug}`),

	//---- Services ---
	createService: (
		businessId: string,
		payload: { name: string; duration_minutes: number; price_kes: number; deposit_kes: number }
	) => 
		request<Service>(`/businesses/${businessId}/services`, {
			method: "POST",
			body: JSON.stringify(payload),
		}),

	listServices: (businessId: string) => request<Service[]>(`/businesses/${businessId}/services`),

	//---- Avaukability Rules (business hours)---
	createAvailabilityRule: (
		businessId: string,
		payload: { day_of_week: number; start_time: string; end_time: string}
	) => 
		request<AvailabilityRule>(`/businesses/${businessId}/availability-rules`, {
			method: "POST",
			body: JSON.stringify(payload),			
		}),
	listAvailabilityRules: (businessId: string) => 
		request<AvailabilityRule[]>(`/businesses/${businessId}/availability-rules`),

	deleteAvailabilityRule: (businessId: string, ruleId: string) =>
		request<void>(`/businesses/${businessId}/availability-rules/${ruleId}`, { method: "DELETE" }),
	

	// --- Computed open slots ---
	getAvailability: (businessId: string, serviceId: string, date: string) =>
		request<AvailabilityResponse>(
			`/businesses/${businessId}/availability?service_id=${serviceId}&date=${date}`
		),

	//-----booking----
	createBooking: (
		businessId: string,
		payload: { service_id: string; customer_name: string; customer_phone: string; slot_start: string }
	) => 
		request<Booking>(`/businesses/${businessId}/bookings`, {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	
	getBookingStatus: (businessId: string, bookingId: string) =>
		request<{ id: string; status: string }>(`/businesses/${businessId}/bookings/${bookingId}/status`),

	checkPayment: (businessId: string, bookingId: string) => 
		request<Booking>(`/businesses/${businessId}/bookings/${bookingId}/check-payment`, {
			method: "POST"
		}),
	
};

export { ApiError }

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

