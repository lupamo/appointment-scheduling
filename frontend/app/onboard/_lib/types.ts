export type Step = "business" | "services" | "hours" | "share";

export const STEPS: { key: Step; label: string }[] = [
	{ key: "business", label: "Business" },
	{ key: "services", label: "Services" },
	{ key: "hours", label: "Hours" },
	{ key: "share", label: "Share Link" },
]
