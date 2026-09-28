"use client";

import React, { useState } from "react";
import { api, ApiError, AvailabilityRule, Business, DAY_LABELS_FULL } from "@/lib/api";
import { FloatingField, floatingInputClass } from "../../../components/FormControls";

export function HoursStep({
  business,
  rules,
  setRules,
  onDone,
}: {
  business: Business;
  rules: AvailabilityRule[];
  setRules: (r: AvailabilityRule[]) => void;
  onDone: () => void;
}) {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  };

  async function addHours(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectedDays.size === 0) {
      setError("Pick at least one day.");
      return;
    }
    setLoading(true);
    try {
      const created: AvailabilityRule[] = [];
      for (const day of selectedDays) {
        const rule = await api.createAvailabilityRule(business.id, {
          day_of_week: day,
          start_time: `${start}:00`,
          end_time: `${end}:00`,
        });
        created.push(rule);
      }
      setRules([...rules, ...created]);
      setSelectedDays(new Set());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save those hours.");
    } finally {
      setLoading(false);
    }
  }

  async function removeRule(ruleId: string) {
    await api.deleteAvailabilityRule(business.id, ruleId);
    setRules(rules.filter((r) => r.id !== ruleId));
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        When are you open?
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Customers can only book within these hours.
      </p>

      {/* Added Hours List */}
      {rules.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
          {rules
            .slice()
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="font-medium text-gray-900">
                  {DAY_LABELS_FULL[r.day_of_week]}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-gray-500 tabular-nums">
                    {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRule(r.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                    aria-label={`Remove ${DAY_LABELS_FULL[r.day_of_week]} hours`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={addHours} className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm mb-6">
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-2.5">
            Select Days
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS_FULL.map((label, i) => {
              const active = selectedDays.has(i);
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FloatingField label="Opens" required>
            <input
              type="time"
              className={floatingInputClass}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </FloatingField>

          <FloatingField label="Closes" required>
            <input
              type="time"
              className={floatingInputClass}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
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
          {loading ? "Saving..." : "+ Add Hours"}
        </button>
      </form>

      {/* Primary Action Button */}
      <button
        onClick={onDone}
        disabled={rules.length === 0}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-sm disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}