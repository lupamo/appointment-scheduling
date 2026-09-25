"use client";

import { useState } from "react";
import { api, ApiError, AvailabilityRule, Business, DAY_LABELS_FULL } from "@/lib/api";
import { Field, inputClass } from "./FormControls";

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
    <div>
      <h1 className="text-2xl mb-1">When are you open?</h1>
      <p className="text-white/50 text-sm mb-8">
        Customers can only book within these hours.
      </p>

      {rules.length > 0 && (
        <ul className="mb-8 divide-y hairline border hairline rounded-sm overflow-hidden">
          {rules
            .slice()
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{DAY_LABELS_FULL[r.day_of_week]}</span>
                <span className="flex items-center gap-3">
                  <span className="text-white/50 tabular">
                    {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                  </span>
                  <button
                    onClick={() => removeRule(r.id)}
                    className="text-white/40 hover:text-alert text-xs"
                    aria-label={`Remove ${DAY_LABELS_FULL[r.day_of_week]} hours`}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
        </ul>
      )}

      <form onSubmit={addHours} className="border hairline rounded-sm p-5 mb-6">
        <span className="block text-sm text-white/60 mb-2">Days</span>
        <div className="flex flex-wrap gap-2 mb-5">
          {DAY_LABELS_FULL.map((label, i) => (
            <button
              type="button"
              key={i}
              onClick={() => toggleDay(i)}
              className={`px-3 py-1.5 rounded-sm text-sm border hairline transition ${
                selectedDays.has(i) ? "bg-accent text-accent-ink border-accent" : "text-white/70"
              }`}
            >
              {label.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens">
            <input
              type="time"
              className={inputClass}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </Field>
          <Field label="Closes">
            <input
              type="time"
              className={inputClass}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </Field>
        </div>
        {error && <p className="text-alert text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="border hairline text-white px-4 py-2 rounded-sm text-sm hover:border-accent transition disabled:opacity-50"
        >
          {loading ? "Saving…" : "Add hours"}
        </button>
      </form>

      <button
        onClick={onDone}
        disabled={rules.length === 0}
        className="bg-accent text-accent-ink font-medium px-5 py-2.5 rounded-sm hover:brightness-110 transition disabled:opacity-30"
      >
        Continue
      </button>
    </div>
  );
}
