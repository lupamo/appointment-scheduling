export const inputClass =
  "w-full bg-gray-800 border border-gray-600 rounded-sm px-3 py-2.5 text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-5">
      <span className="block text-sm text-gray-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}