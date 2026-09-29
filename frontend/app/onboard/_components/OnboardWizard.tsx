"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Business, Service, AvailabilityRule } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { Step, STEPS } from "../_lib/types";
import { StepNav } from "../_components/StepNav";
import BusinessStep from "./BusinessStep";
import BrandingStep from "./BrandingStep";
import HoursStep from "./HoursStep";
import { ServicesStep } from "./ServicesStep";
import { ShareStep } from "./ShareStep";

type AuthState = "checking" | "authed" | "rejected";

export default function OnboardWizard() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  const [step, setStep] = useState<Step>("business");
  const [completed, setCompleted] = useState<Set<Step>>(new Set());
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);

  // Auth guard
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me()
      .then(() => setAuthState("authed"))
      .catch(() => {
        clearToken();
        setAuthState("rejected");
        router.replace("/login");
      });
  }, [router]);

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

  if (authState !== "authed") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2.5 text-gray-500 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>
            {authState === "checking"
              ? "Checking your session…"
              : "Redirecting to login…"}
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 md:py-16">
      <div className="max-w-4xl mx-auto md:flex md:gap-12 lg:gap-16 items-start">
        {/* Step Navigation Sidebar */}
        <aside className="w-full md:w-56 shrink-0 mb-8 md:mb-0 sticky top-10">
          <StepNav
            steps={STEPS}
            current={step}
            completed={completed}
            onNavigate={goTo}
          />
        </aside>

        {/* Dynamic Wizard Step Content */}
        <div className="flex-1 min-w-0">
          {step === "business" && (
            <BusinessStep
              onDone={(b) => {
                setBusiness(b);
                finishStep("business", "branding");
              }}
            />
          )}
          {step === "branding" && business && (
            <BrandingStep
              business={business}
              setBusiness={setBusiness}
              onDone={() => finishStep("branding", "services")}
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
