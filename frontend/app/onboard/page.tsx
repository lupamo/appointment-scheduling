"use client";
 
import { useState } from "react";
import { api, ApiError, Business, Service, AvailabilityRule, DAY_LABELS_FULL } from "@/lib/api";
 
type Step = "business" | "services" | "hours" | "share";
 
const STEPS: { key: Step; label: string }[] = [
  { key: "business", label: "Business" },
  { key: "services", label: "Services" },
  { key: "hours", label: "Hours" },
  { key: "share", label: "Share link" },
];
 
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OnboardPage() {
  const [step, setStep] = useState<Step>("business");
  const [completed, setCompleted] = useState<Set<Step>>(new Set());
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
 
  const goTo = (s: Step) => {
    if (s === step) return;
    const idx = STEPS.findIndex((x) => x.key === s);
    const currentIdx = STEPS.findIndex((x) => x.key === step);
    if (idx <= currentIdx || completed.has(STEPS[idx - 1]?.key)) setStep(s);
  };
 
  const finishStep = (s: Step, next: Step) => {
    setCompleted((prev) => new Set(prev).add(s));
    setStep(next);
  };
 
  return (
    <main className="min-h-screen px-6 py-10 md:py-16">
      <div className="max-w-3xl mx-auto md:flex md:gap-16">
        <nav className="mb-10 md:mb-0 md:w-40 md:shrink-0">
          <ol className="flex md:flex-col gap-4 md:gap-6">
            {STEPS.map((s, i) => {
              const isCurrent = s.key === step;
              const isDone = completed.has(s.key);
              const reachable =
                isDone || isCurrent || (i > 0 && completed.has(STEPS[i - 1].key));
              return (
                <li key={s.key}>
                  <button
                    onClick={() => reachable && goTo(s.key)}
                    disabled={!reachable}
                    className={`text-left text-sm flex items-center gap-2 ${
                      isCurrent ? "text-accent" : isDone ? "text-white/80" : "text-white/30"
                    } ${reachable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isCurrent ? "bg-accent" : isDone ? "bg-white/60" : "bg-white/20"
                      }`}
                    />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
 
        <div className="flex-1 min-w-0">
          {step === "business" && (
            <BusinessStep
              onDone={(b) => {
                setBusiness(b);
                finishStep("business", "services");
              }}
            />
          )}
          {step === "services" && business && (
            <ServicesStep
              business={business}
              services={services}
              setServices={setServices}
              onDone={() => finishStep("services", "hours")}
            />
          )}
          {step === "hours" && business && (
            <HoursStep
              business={business}
              rules={rules}
              setRules={setRules}
              onDone={() => finishStep("hours", "share")}
            />
          )}
          {step === "share" && business && <ShareStep business={business} />}
        </div>
      </div>
    </main>
  );
}


function Field({ label, children,}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-5">
      <span className="block text-sm text-white/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}