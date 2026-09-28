"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/lib/api";
import { FloatingField } from "../../../components/FormControls";

export function ShareStep({ business }: { business: Business }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/book/${business.slug}`
      : `/book/${business.slug}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Your booking page is ready
        </h1>
        <p className="text-sm text-gray-500">
          Share this link with your clients—they can view services, pick a time, and pay a deposit instantly.
        </p>
      </div>

      <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm mb-6">
        <FloatingField label="Your Booking Link">
          <div className="relative flex items-center">
            <input
              readOnly
              value={link}
              className="w-full h-12 pr-24 pl-3.5 pt-1 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 focus:outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={copy}
              className="absolute right-1.5 h-9 px-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition duration-150 shadow-xs"
            >
              {copied ? "Copied! " : "Copy"}
            </button>
          </div>
        </FloatingField>

        <div className="flex gap-3 mt-4">
          <a
            href={`/book/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="w-full h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs rounded-xl transition duration-150 flex items-center justify-center gap-1.5"
          >
            <span>Preview Page</span>
            <svg
              className="w-3.5 h-3.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      <button
        onClick={() => router.push(`/dashboard/${business.id}`)}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition duration-150 shadow-sm mb-4"
      >
        Go to Dashboard
      </button>

      <p className="text-center text-xs text-gray-400">
        You can update your services, prices, or working hours at any time from your dashboard.
      </p>
    </div>
  );
}