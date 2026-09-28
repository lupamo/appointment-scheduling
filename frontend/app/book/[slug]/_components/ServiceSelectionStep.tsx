"use client";

import { Service } from "@/lib/api";

interface ServiceSelectionStepProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export function ServiceSelectionStep({
  services,
  onSelectService,
}: ServiceSelectionStepProps) {
  return (
    <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Service</h2>
      {services.length === 0 ? (
        <p className="text-sm text-gray-500">No services available</p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelectService(service)}
              className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xs transition duration-150 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                  {service.name}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  KES {service.price_kes}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {service.duration_minutes} min · Deposit: KES {service.deposit_kes}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

