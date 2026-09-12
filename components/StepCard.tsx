// components/StepCard.tsx
import { LucideIcon } from "lucide-react";

interface StepCardProps {
  icon: LucideIcon;
  iconColor: string;
  step: string; // "01"
  title: string;
  description: string;
  tip: string;
  tipIcon?: LucideIcon;
}

export function StepCard({
  icon: Icon,
  step,
  title,
  description,
  tip,
  iconColor,
  tipIcon: TipIcon,
}: StepCardProps) {
  return (
<div className="flex flex-col flex-1 basis-0 w-full  p-6 border rounded-2xl shadow-lg dark:bg-slate-950 dark:border-slate-800 bg-white  border-stone-200">
      <div className="flex flex-row justify-between items-center py-5">
        <Icon className="w-10 h-10 rounded-xl p-2 dark:bg-slate-800 border dark:border-slate-700 dark:text-emerald-500 bg-emerald-100 border-stone-200 text-emerald-500" />
        <p className="text-2xl dark:text-slate-400 text-stone-500">{step}</p>
      </div>
      <h5 className="mb-3 text-2xl font-semibold tracking-tight text-heading leading-8 dark:text-white text-stone-900">
        {title}
      </h5>
      <p className=" dark:text-slate-400 text-stone-700">{description}</p>
      <div className="flex flex-row items-top gap-2 mt-auto pt-10 dark:text-emerald-500 text-emerald-600">
        {TipIcon && <TipIcon className="w-5 h-5" />}
        <span className="font-semibold">{tip}</span>
      </div>
    </div>
  );
}