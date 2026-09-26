"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/lib/api";

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
    <div>
      <h1 className="text-2xl mb-1 text-white">You&apos;re live</h1>
      <p className="text-gray-400 text-sm mb-8">
        Share this link — customers pay a deposit to lock their slot, no back-and-forth.
      </p>

      <div className="bg-gray-800 text-white rounded-sm p-5 mb-6">
        <p className="text-xs text-gray-400 mb-1">Your booking link</p>
        <p className="tabular text-sm text-white break-all mb-4">{link}</p>
        <div className="border-t border-dashed border-gray-600 pt-4 flex gap-3">
          <button
            onClick={copy}
            className="bg-orange-500 text-black px-4 py-2 rounded-sm text-sm hover:bg-orange-600 transition"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={`/book/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="border border-gray-600 px-4 py-2 rounded-sm text-sm text-gray-300 hover:border-orange-500 transition"
          >
            View page
          </a>
        </div>
      </div>

      <button
        onClick={() => router.push(`/dashboard/${business.id}`)}
        className="w-full bg-orange-500 text-black font-medium py-3 rounded-sm hover:bg-orange-600 transition mb-4"
      >
        Go to Dashboard
      </button>

      <p className="text-gray-500 text-xs">
        You can add more services or adjust your hours any time.
      </p>
    </div>
  );
}
