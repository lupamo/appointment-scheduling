"use client";

import { ShieldCheck, Zap, Lock, CreditCard } from "lucide-react";

export default function SocialProofBanner() {
  const highlights = [
    { icon: ShieldCheck, label: "Zero No-Shows" },
    { icon: Zap, label: "Instant M-Pesa / Card Payouts" },
    { icon: Lock, label: "Bank-Grade Deposit Security" },
    { icon: CreditCard, label: "Automated Refunds" },
  ];

  return (
    <div className="w-full bg-slate-900 text-white py-8 px-6 my-8">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-around items-center gap-6 opacity-90">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold tracking-wide uppercase text-slate-200">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}