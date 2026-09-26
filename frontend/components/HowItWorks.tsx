"use client";

import { Share2, CreditCard, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Share2,
    title: "1. Share Your Link",
    desc: "Send clients your booking link or embed it on social media.",
  },
  {
    icon: CreditCard,
    title: "2. Client Pays Deposit",
    desc: "The slot locks only after a required upfront deposit is made.",
  },
  {
    icon: CalendarCheck,
    title: "3. Confirmed Appointment",
    desc: "You get paid for your time, eliminating empty seats and no-shows.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900">
          How Nipate works! Protects Your Schedule
        </h2>
		<h3 className="text-sm font-bold text-[#4F73EE] tracking-widest uppercase mb-2">
          Simple 3-Step Process
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-4"
            >
              <div className="p-3 bg-blue-50 text-[#4F73EE] rounded-xl">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}