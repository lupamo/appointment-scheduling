"use client";

import { Service } from "@/lib/api";
import { FloatingField, floatingInputClass } from "../../../../components/FormControls";

interface CustomerDetailsStepProps {
  selectedService: Service;
  selectedSlot: string;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  isCreatingBooking: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function CustomerDetailsStep({
  selectedService,
  selectedSlot,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  isCreatingBooking,
  onSubmit,
  onBack,
}: CustomerDetailsStepProps) {
  return (
    <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4 transition"
      >
        ← Back to slots
      </button>

      <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Details</h2>

      <div className="space-y-4">
        <FloatingField label="Full Name" required>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={floatingInputClass}
            placeholder="Jane Doe"
            required
          />
        </FloatingField>

        <FloatingField label="M-Pesa Phone Number" required>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className={floatingInputClass}
            placeholder="2547XXXXXXXX"
            required
          />
        </FloatingField>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <p className="text-xs font-medium text-gray-500 mb-1">Booking Summary</p>
          <p className="text-sm font-semibold text-gray-900">{selectedService.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {new Date(selectedSlot).toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-blue-600 mt-2">
            Required Deposit: KES {selectedService.deposit_kes}
          </p>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isCreatingBooking || !customerName || !customerPhone}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 disabled:opacity-50"
        >
          {isCreatingBooking ? "Creating Booking..." : "Proceed to Payment"}
        </button>
      </div>
    </div>
  );
}
