import React from 'react';
import type { AttentionAlert, DashboardMetric } from '../types';

interface ExecutiveSummaryPanelProps {
  metrics: DashboardMetric[];
  alerts: AttentionAlert[];
}

const ExecutiveSummaryPanel = ({ metrics, alerts }: ExecutiveSummaryPanelProps) => (
  <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
    <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Executive summary</h2>
          <p className="mt-1 text-sm text-slate-500">Los cuatro indicadores que mejor explican el estado operativo del backlog.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <article key={metric.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{metric.title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{metric.detail}</p>
          </article>
        ))}
      </div>
    </div>

    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl">
      <h2 className="text-xl font-semibold">Señales IA / Gobernanza</h2>
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl bg-white/5 px-4 py-3">
            <p className="text-sm font-medium text-white">{alert.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{alert.detail}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default ExecutiveSummaryPanel;
