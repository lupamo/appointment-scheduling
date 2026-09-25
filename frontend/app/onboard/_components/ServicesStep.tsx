"use client";

import { useState } from "react";
import { api, ApiError, Business, Service } from "@/lib/api";
import { Field, inputClass } from "./FormControls";

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
    <div>
      <h1 className="text-2xl mb-1">What do you offer?</h1>
      <p className="text-white/50 text-sm mb-8">
        Add each service with its price and the deposit needed to hold a slot.
      </p>

      {services.length > 0 && (
        <ul className="mb-8 divide-y hairline border hairline rounded-sm overflow-hidden">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{s.name}</span>
              <span className="text-white/50 tabular">
                {s.duration_minutes} min · KES {s.price_kes} · deposit KES {s.deposit_kes}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addService} className="border hairline rounded-sm p-5 mb-6">
        <Field label="Service name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Haircut"
            required
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Duration (min)">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </Field>
          <Field label="Price (KES)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </Field>
          <Field label="Deposit (KES)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              required
            />
          </Field>
        </div>
        {error && <p className="text-alert text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="border hairline px-4 py-2 rounded-sm text-sm hover:border-accent transition disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add service"}
        </button>
      </form>

      <button
        onClick={onDone}
        disabled={services.length === 0}
        className="bg-accent text-accent-ink font-medium px-5 py-2.5 rounded-sm hover:brightness-110 transition disabled:opacity-30"
      >
        Continue
      </button>
    </div>
  );
}
