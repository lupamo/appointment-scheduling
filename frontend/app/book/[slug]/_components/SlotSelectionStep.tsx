"use client";

import { Service } from "@/lib/api";
import { FloatingField, floatingInputClass } from "../../../../components/FormControls";

interface SlotSelectionStepProps {
  selectedService: Service;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableSlots: string[];
  onCheckSlots: () => void;
  onSelectSlot: (slot: string) => void;
  onBack: () => void;
}

export function SlotSelectionStep({
  selectedService,
  selectedDate,
  setSelectedDate,
  availableSlots,
  onCheckSlots,
  onSelectSlot,
  onBack,
}: SlotSelectionStepProps) {
  return (
    <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4 transition"
      >
        ← Back to services
      </button>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date & Time</h2>

      <div className="mb-4">
        <FloatingField label="Select Date" required>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={floatingInputClass}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </FloatingField>
      </div>

      <button
        type="button"
        onClick={onCheckSlots}
        disabled={!selectedDate}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 disabled:opacity-50 mb-6"
      >
        Check Availability
      </button>

      {availableSlots.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-3">Available Slots</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className="py-2.5 px-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-500 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition"
              >
                {new Date(slot).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableSlots.length === 0 && selectedDate && (
        <p className="text-xs text-gray-500 text-center">
          No available slots for this date. Please pick another day.
        </p>
      )}
    </div>
  );
}
