"use client";

import { Booking } from "@/lib/api";

interface ConfirmationStepProps {
  booking: Booking;
  onReset: () => void;
}

export function ConfirmationStep({ booking, onReset }: ConfirmationStepProps) {
  return (
    <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm text-center">
      <div className="text-5xl mb-3">✅</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        Booking Confirmed!
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Your appointment has been successfully booked.
      </p>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl mb-6 text-left">
        <p className="text-xs font-medium text-gray-500 mb-1">M-Pesa Receipt Number</p>
        <p className="text-sm font-semibold text-gray-900">
          {booking.mpesa_receipt_number || "Processing..."}
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150"
      >
        Book Another Appointment
      </button>
    </div>
  );
}
