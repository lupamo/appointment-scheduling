import React from "react";

export function Field({label, children} : {label: string; children: React.ReactNode;}) {
	return (
		<label className="block mb-5">
			<span className="block text-sm text-[#393d49]">{label}</span>
		</label>
	)
}

export const inputClass = "w-full bg-amber-400 border hairline rounded-sm px-3 py-2.5 text-white placeholder:text-white/30 focus:border-accent";
