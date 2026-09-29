"use client"

import { Step, StepDef } from "../_lib/types"

interface StepNavProps {
	steps: StepDef[],
	current: Step;
	completed: Set<Step>
	onNavigate: (s: Step) => void;
}

export function StepNav({ steps, current, completed, onNavigate,}: StepNavProps) {
	return (
		<nav className="mb-8 w-full">
			<div className="flex items-center justify-between p-1 bg-gray-100 rounded-2xl border border-gray-200">
				{steps.map((s, i) => {
					const isCurrent = s.key === current;
					const isDone = completed.has(s.key);
					const reachable = isDone || isCurrent || (i > 0 && completed.has(steps[i - 1].key));

					return (
						<button
							key={s.key}
							type="button"
							onClick={() => reachable && onNavigate(s.key)}
							disabled={!reachable}
							className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all text-center
								${
								isCurrent
									? "bg-white text-gray-900 shadow-sm"
									: isDone
									? "text-gray-700 hover:text-gray-900"
									: "text-gray-400"
								}
								${reachable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
						>
							{s.label}
						</button>
					)
				})}
			</div>
		</nav>
	)
}


