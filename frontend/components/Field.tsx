export const inputClass =
  "w-full bg-ink-2 border hairline rounded-sm px-3 py-2.5 text-white placeholder:text-white/30 focus:border-accent";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-5">
      <span className="block text-sm text-white/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}