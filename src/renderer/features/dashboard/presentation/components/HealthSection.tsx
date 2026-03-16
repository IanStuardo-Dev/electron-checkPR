import React from 'react';
import type { HealthIndicator } from '../../../../shared/dashboard/summary.types';

interface HealthSectionProps {
  title: string;
  description: string;
  indicators: HealthIndicator[];
}

const toneClassMap: Record<HealthIndicator['tone'], string> = {
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const HealthSection = ({ title, description, indicators }: HealthSectionProps) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {indicators.map((indicator) => (
        <article
          key={indicator.id}
          className={`rounded-2xl border p-4 ${toneClassMap[indicator.tone]}`}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em]">{indicator.title}</p>
          <p className="mt-3 text-3xl font-semibold">{indicator.value}</p>
          <p className="mt-2 text-sm opacity-80">{indicator.description}</p>
        </article>
      ))}
    </div>
  </section>
);

export default HealthSection;
