"use client";

import React, { useState } from "react";
import { api, ApiError, Business, Service } from "@/lib/api";
import { FloatingField, floatingInputClass } from "../../../components/FormControls";

export function ServicesStep({
  business,
  services,
  setServices,
  onDone,
}: {
  business: Business;
  services: Service[];
  setServices: (s: Service[]) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const service = await api.createService(business.id, {
        name,
        duration_minutes: Number(duration),
        price_kes: Number(price),
        deposit_kes: Number(deposit),
      });
      setServices([...services, service]);
      setName("");
      setPrice("");
      setDeposit("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't add that service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        What do you offer?
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Add each service with its price and the deposit needed to hold a slot.
      </p>

      {/* Added Services List */}
      {services.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="font-medium text-gray-900">{s.name}</span>
              <span className="text-xs font-medium text-gray-500 tabular-nums">
                {s.duration_minutes} min · KES {s.price_kes} · Deposit KES {s.deposit_kes}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Form Card */}
      <form onSubmit={addService} className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm mb-6">
        <FloatingField label="Service Name" required>
          <input
            className={floatingInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Haircut & Styling"
            required
          />
        </FloatingField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FloatingField label="Duration (min)" required>
            <input
              type="number"
              min={1}
              className={floatingInputClass}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </FloatingField>

          <FloatingField label="Price (KES)" required>
            <input
              type="number"
              min={0}
              className={floatingInputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1500"
              required
            />
          </FloatingField>

          <FloatingField label="Deposit (KES)" required>
            <input
              type="number"
              min={0}
              className={floatingInputClass}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="500"
              required
            />
          </FloatingField>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition duration-150 disabled:opacity-50"
        >
          {loading ? "Adding..." : "+ Add Service"}
        </button>
      </form>

      {/* Primary Navigation Button */}
      <button
        onClick={onDone}
        disabled={services.length === 0}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-sm disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}