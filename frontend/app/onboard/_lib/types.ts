export type Step = "business" | "branding" | "services" | "hours" | "share";

export interface StepDef {
  key: Step;
  label: string;
}

export const STEPS: StepDef[] = [
  { key: "business", label: "Business" },
  { key: "branding", label: "Branding" },
  { key: "services", label: "Services" },
  { key: "hours", label: "Hours" },
  { key: "share", label: "Share link" },
];