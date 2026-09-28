"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Business, Service, Booking } from "@/lib/api";

import { ServiceSelectionStep } from "./_components/ServiceSelectionStep";
import { SlotSelectionStep } from "./_components//SlotSelectionStep";
import { CustomerDetailsStep } from "./_components/CustomerDetailsStep";
import { PaymentStep } from "./_components/PaymentStep";
import { ConfirmationStep } from "./_components//ConfirmationStep";

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
  const [step, setStep] = useState<
    "details" | "slots" | "form" | "payment" | "confirmed"
  >("details");

  useEffect(() => {
    async function loadBusinessData() {
      try {
        const slug = params.slug as string;
        const businessData = await api.getBusinessBySlug(slug);
        setBusiness(businessData);

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
      const response = await api.getAvailability(
        business.id,
        selectedService.id,
        selectedDate
      );
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
        slot_start: selectedSlot,
      });

      setBooking(newBooking);
      setStep("payment");
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
        // Continue polling
      }
    }, 3000);

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </main>
    );
  }

  if (error && !business) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center bg-white border border-gray-200 rounded-3xl p-8 max-w-sm w-full shadow-sm">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 md:py-16 bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* Business Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {business?.name}
          </h1>
          <p className="text-xs text-gray-500 font-medium">Book your appointment</p>
        </div>

        {/* Step Views */}
        {step === "details" && (
          <ServiceSelectionStep
            services={services}
            onSelectService={(service) => {
              setSelectedService(service);
              setStep("slots");
            }}
          />
        )}

        {step === "slots" && selectedService && (
          <SlotSelectionStep
            selectedService={selectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            availableSlots={availableSlots}
            onCheckSlots={loadAvailableSlots}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setStep("form");
            }}
            onBack={() => setStep("details")}
          />
        )}

        {step === "form" && selectedService && selectedSlot && (
          <CustomerDetailsStep
            selectedService={selectedService}
            selectedSlot={selectedSlot}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            isCreatingBooking={isCreatingBooking}
            onSubmit={createBooking}
            onBack={() => setStep("slots")}
          />
        )}

        {step === "payment" && booking && (
          <PaymentStep
            isCheckingPayment={isCheckingPayment}
            onCheckStatus={checkPaymentStatus}
          />
        )}

        {step === "confirmed" && booking && (
          <ConfirmationStep
            booking={booking}
            onReset={() => {
              setStep("details");
              setSelectedService(null);
              setSelectedSlot(null);
              setBooking(null);
            }}
          />
        )}

        {/* Inline Error Toast */}
        {error && business && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
            <p className="text-xs font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              className="text-xs font-semibold text-red-700 hover:underline ml-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}