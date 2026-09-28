import React from "react";

interface FloatingFieldProps {
	label: string;
	required?: boolean;
	children: React.ReactNode;
}

export function FloatingField({label, required, children} : FloatingFieldProps) {
	return (
		<div className="relative mb-5">
			<label className="absolute -top-2.5 left-3.5 bg-white px-1 text-xs font-medium text-gray-500 z-10 select-none">
				{label}
				{required && <span className="text-red-500 ml-0.5">*</span>}
			</label>
			{children}
		</div>
	)
}

export const floatingInputClass =
  "w-full h-12 px-3.5 pt-1 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";