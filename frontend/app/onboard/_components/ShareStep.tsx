"use client";

import { useState } from "react";
import { Business } from "@/lib/api";

export function ShareStep({ business }: { business: Business }) {
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
    <div>
      <h1 className="text-2xl mb-1">You&apos;re live</h1>
      <p className="text-white/50 text-sm mb-8">
        Share this link — customers pay a deposit to lock their slot, no back-and-forth.
      </p>

      <div className="bg-paper text-[#191510] rounded-sm p-5 mb-6 ticket-notch">
        <p className="text-xs text-[#191510]/50 mb-1">Your booking link</p>
        <p className="tabular text-sm break-all mb-4">{link}</p>
        <div className="border-t border-dashed hairline-paper pt-4 flex gap-3">
          <button
            onClick={copy}
            className="bg-[#191510] text-paper px-4 py-2 rounded-sm text-sm hover:brightness-125 transition"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={`/book/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="border hairline-paper px-4 py-2 rounded-sm text-sm"
          >
            View page
          </a>
        </div>
      </div>

      <p className="text-white/40 text-xs">
        You can add more services or adjust your hours any time.
      </p>
    </div>
  );
}
