export type BadgeTone = 'sky' | 'emerald' | 'amber' | 'slate' | 'rose';

export const badgeToneClassName: Record<BadgeTone, string> = {
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
};

export const settingsButtonClassName = 'inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600';
