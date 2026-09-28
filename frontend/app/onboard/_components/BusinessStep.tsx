"use client";

import React, { useState } from "react";
import { api, ApiError, Business } from "@/lib/api";
import { FloatingField, floatingInputClass } from "./FormControls";
import { slugify } from "../_lib/slugify";

export function BusinessStep({ onDone }: { onDone: (b: Business) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"phone" | "shortcode">("phone");
  const [payoutPhone, setPayoutPhone] = useState("");
  const [shortcode, setShortCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const business = await api.createBusiness({
        name,
        phone,
        slug,
        payout_method: payoutMethod,
        payout_phone: payoutMethod === "phone" ? payoutPhone : undefined,
        mpesa_shortcode: payoutMethod === "shortcode" ? shortcode : undefined,
      });
      onDone(business);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Tell us about your business
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        This becomes your public booking page.
      </p>

      <form onSubmit={submit} className="p-8 md:p-10 border border-gray-200 rounded-3xl bg-white shadow-sm">
        <FloatingField label="Business Name" required>
          <input
            className={floatingInputClass}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Sora Consulting"
            required
          />
        </FloatingField>

        <FloatingField label="Contact Phone" required>
          <input
            className={floatingInputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2547XXXXXXXX"
            required
          />
        </FloatingField>

        <FloatingField label="Booking Link" required>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-medium text-gray-400 select-none pointer-events-none">
              yourapp.com/book/
            </span>
            <input
              className={`${floatingInputClass} pl-[125px]`}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
        </FloatingField>

        <fieldset className="mt-6 mb-5">
          <legend className="block text-xs font-medium text-gray-600 mb-3">
            Where Should Deposits Go?
          </legend>

          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="payoutMethod"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                checked={payoutMethod === "phone"}
                onChange={() => setPayoutMethod("phone")}
              />
              My Mpesa Number
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="payoutMethod"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                checked={payoutMethod === "shortcode"}
                onChange={() => setPayoutMethod("shortcode")}
              />
              I have a Paybill/Till
            </label>
          </div>

          {payoutMethod === "phone" ? (
            <FloatingField label="Mpesa Number" required>
              <input
                className={floatingInputClass}
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
                required
              />
            </FloatingField>
          ) : (
            <FloatingField label="Paybill / Till Code" required>
              <input
                className={floatingInputClass}
                value={shortcode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder="6-digit shortcode"
                required
              />
            </FloatingField>
          )}
        </fieldset>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}