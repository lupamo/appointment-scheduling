"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Business, Service, Booking } from "@/lib/api";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "slots" | "form" | "payment" | "confirmed">("details");

  useEffect(() => {
    async function loadBusinessData() {
      try {
        const slug = params.slug as string;
        const businessData = await api.getBusinessBySlug(slug);
        setBusiness(businessData);

        // Load services using the business ID
        const servicesData = await api.listServices(businessData.id);
        setServices(servicesData);
      } catch (err) {
        setError("Business not found");
      } finally {
        setIsLoading(false);
      }
    }

    loadBusinessData();
  }, [params.slug]);

  async function loadAvailableSlots() {
    if (!selectedService || !selectedDate || !business) return;

    try {
      const response = await api.getAvailability(business.id, selectedService.id, selectedDate);
      setAvailableSlots(response.slots);
      setStep("slots");
    } catch (err) {
      setError("Failed to load available slots");
    }
  }

  async function createBooking() {
    if (!selectedService || !selectedSlot || !business) return;

    setIsCreatingBooking(true);
    setError(null);

    try {
      const newBooking = await api.createBooking(business.id, {
        service_id: selectedService.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        slot_start: selectedSlot
      });

      setBooking(newBooking);
      setStep("payment");
      // Start polling for payment status
      pollPaymentStatus(newBooking.id);
    } catch (err) {
      setError("Failed to create booking");
      setIsCreatingBooking(false);
    }
  }

  async function pollPaymentStatus(bookingId: string) {
    setIsCheckingPayment(true);

    const pollInterval = setInterval(async () => {
      try {
        const status = await api.checkPayment(business!.id, bookingId);
        setBooking(status);

        if (status.status === "confirmed") {
          clearInterval(pollInterval);
          setIsCheckingPayment(false);
          setStep("confirmed");
        } else if (status.status === "expired") {
          clearInterval(pollInterval);
          setIsCheckingPayment(false);
          setError("Payment expired. Please try again.");
        }
      } catch (err) {
        // Continue polling on error
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsCheckingPayment(false);
    }, 5 * 60 * 1000);
  }

  async function checkPaymentStatus() {
    if (!booking || !business) return;

    try {
      const status = await api.checkPayment(business.id, booking.id);
      setBooking(status);

      if (status.status === "confirmed") {
        setStep("confirmed");
      } else if (status.status === "expired") {
        setError("Payment expired. Please try again.");
      }
    } catch (err) {
      setError("Failed to check payment status");
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Business not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-orange-500 text-black px-4 py-2 rounded-sm"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-white mb-2">{business.name}</h1>
          <p className="text-gray-400">Book your appointment</p>
        </div>

        {step === "details" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl text-white mb-4">Select a Service</h2>
            {services.length === 0 ? (
              <p className="text-gray-400">No services available</p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep("slots");
                    }}
                    className="w-full bg-gray-700 text-white p-4 rounded-sm hover:bg-gray-600 transition text-left"
                  >
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {service.duration_minutes} min · KES {service.price_kes} (deposit: KES {service.deposit_kes})
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "slots" && selectedService && (
          <div className="bg-gray-800 rounded-lg p-6">
            <button
              onClick={() => setStep("details")}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back to services
            </button>
            <h2 className="text-xl text-white mb-4">Select Date & Time</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <button
              onClick={loadAvailableSlots}
              disabled={!selectedDate}
              className="w-full bg-orange-500 text-black py-2 rounded-sm hover:bg-orange-600 transition disabled:opacity-50 mb-4"
            >
              Check Availability
            </button>

            {availableSlots.length > 0 && (
              <div>
                <h3 className="text-lg text-white mb-3">Available Slots</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("form");
                      }}
                      className="bg-gray-700 text-white p-3 rounded-sm hover:bg-gray-600 transition"
                    >
                      {new Date(slot).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableSlots.length === 0 && selectedDate && (
              <p className="text-gray-400">No available slots for this date</p>
            )}
          </div>
        )}

        {step === "form" && selectedService && selectedSlot && (
          <div className="bg-gray-800 rounded-lg p-6">
            <button
              onClick={() => setStep("slots")}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back to slots
            </button>
            <h2 className="text-xl text-white mb-4">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-sm px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="bg-gray-700 p-4 rounded-sm">
                <p className="text-sm text-gray-300 mb-2">Booking Summary</p>
                <p className="text-white font-medium">{selectedService.name}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedSlot).toLocaleString()}
                </p>
                <p className="text-orange-400 font-medium mt-2">
                  Deposit: KES {selectedService.deposit_kes}
                </p>
              </div>
              <button
                onClick={createBooking}
                disabled={isCreatingBooking || !customerName || !customerPhone}
                className="w-full bg-orange-500 text-black py-3 rounded-sm hover:bg-orange-600 transition disabled:opacity-50"
              >
                {isCreatingBooking ? "Creating..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        )}

        {step === "payment" && booking && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl text-white mb-4">Payment Pending</h2>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-white mb-2">Check your phone for M-Pesa STK push</p>
              <p className="text-gray-400 text-sm mb-4">
                Enter your M-Pesa PIN to complete the payment
              </p>
              {isCheckingPayment && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-400">Waiting for payment...</span>
                </div>
              )}
              <button
                onClick={checkPaymentStatus}
                disabled={isCheckingPayment}
                className="mt-4 bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-600 transition disabled:opacity-50"
              >
                Check Status
              </button>
            </div>
          </div>
        )}

        {step === "confirmed" && booking && (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl text-white mb-2">Booking Confirmed!</h2>
            <p className="text-gray-400 mb-4">
              Your appointment has been successfully booked
            </p>
            <div className="bg-gray-700 p-4 rounded-sm mb-6 text-left">
              <p className="text-sm text-gray-300 mb-1">Receipt Number</p>
              <p className="text-white font-medium">{booking.mpesa_receipt_number || "Processing"}</p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="bg-orange-500 text-black px-6 py-3 rounded-sm hover:bg-orange-600 transition"
            >
              Book Another Appointment
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mt-4">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              className="mt-2 text-sm text-red-300 hover:text-red-200"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}