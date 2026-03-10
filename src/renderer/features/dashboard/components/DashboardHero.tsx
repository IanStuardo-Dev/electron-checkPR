import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface DashboardHeroProps {
  providerName: string;
  lastUpdatedLabel: string;
  scopeLabel: string;
}

const DashboardHero = ({ providerName, lastUpdatedLabel, scopeLabel }: DashboardHeroProps) => (
  <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Repository Radar</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Centro operativo para examinar PRs, repositorios y uso de ramas.
        </h1>
        <p className="text-sm text-slate-300">
          Este dashboard prioriza riesgo, cola de revisión y concentración del trabajo por repo y reviewer.
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs text-slate-200">
            Provider: {providerName}
          </div>
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs text-slate-200">
            Scope: {scopeLabel}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-sky-300" />
          <span>Última sincronización: {lastUpdatedLabel}</span>
        </div>
      </div>
    </div>
  </section>
);

export default DashboardHero;
