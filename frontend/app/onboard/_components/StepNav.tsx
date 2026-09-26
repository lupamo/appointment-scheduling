"use client"

import { Step, STEPS } from "../_lib/types"

export function StepNav({ step, completed, onNavigate,}: {
	step:Step;
	completed: Set<Step>
	onNavigate: (s: Step) => void;
}) {
	<nav className="mb-10 md:mb-0 md:w-40 md:shrink-0">
		<ol className="flex md:flex-col gap-4 md:gap-6">
			{STEPS.map((s, i) => {
				const isCurrent = s.key === step;
				const isDone = completed.has(s.key);
				const reachable = isDone || isCurrent || (i > 0 && completed.has(STEPS[i - 1].key));

				return (
					<li key={s.key}>
						<button
							onClick={() => reachable && onNavigate(s.key)}
							disabled={!reachable}
							className={`text-left text-sm flex items-center gap-2 ${
							isCurrent ? "text-orange-400" : isDone ? "text-gray-400": "text-gray-600"
							} ${reachable ? "cursor-pointer" : "cursor-default"}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? "bg-orange-400" : isDone ? "bg-gray-400" : "bg-gray-600"}`}
							/>
							{s.label}
						</button>
					</li>
				)
			})}
		</ol>
	</nav>
}