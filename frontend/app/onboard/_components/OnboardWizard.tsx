"use client";

import { useState } from "react";
import { AvailabilityRule, Business, Service } from "@/lib/api";
import { Step, STEPS } from "../_lib/types";
import { StepNav } from "./StepNav";
import { BusinessStep } from "./BusinessStep";
import { ServicesStep } from "./ServicesStep";
import { HoursStep } from "./HoursStep";
import { ShareStep } from "./ShareStep";

export function OnboardWizard() {
	const [step, setStep] = useState<Step>("business");
	const [completed, setCompleted] = useState<Set<Step>>(new Set())
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

	const handleBusinessCreated = (b: Business) => {
		setBusiness(b);
		finishStep("business", "services");
	};

	return (
		<main className="min-h-screen px-6 py-10 md:py-16 justify-center">
			<div className="max-w-2xl mx-auto flex flex-col">
				<StepNav step={step} completed={completed} onNavigate={goTo} />

				<div className="w-full">
					{step === "business" && (
						<BusinessStep
							onDone={handleBusinessCreated}
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

