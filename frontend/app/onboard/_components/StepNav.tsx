"use client"

import { Step, STEPS } from "../_lib/types"

export function StepNav({ step, completed, onNavigate,}: {
	step:Step;
	completed: Set<Step>
	onNavigate: (s: Step) => void;
}) {
	<nav className="mb-10 md-0 md:w-40 md:shrink-0">
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
							className={`text-left text-sm flex items-center gsp-2 ${
							isCurrent ? "text-amber-400" : isDone ? "text-[#393d49]": "text-white/30"
							} ${reachable ? "cursor-pointer" : "cursor-default"}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? "bg-amber-400" : isDone ? "bg-white/60" : "bg-white/20"}`}
							/>
							{s.label}
						</button>
					</li>
				)
			})}
		</ol>
	</nav>
}