import React from 'react';
import type { AttentionAlert } from '../../../../shared/dashboard/summary.types';

interface GovernanceAlertsProps {
  alerts: AttentionAlert[];
}

const toneClassMap: Record<AttentionAlert['tone'], string> = {
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const GovernanceAlerts = ({ alerts }: GovernanceAlertsProps) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-slate-900">Alertas de gobernanza</h2>
      <p className="mt-1 text-sm text-slate-500">
        Señales que un TL debería revisar antes de que se acumulen deuda o incidentes.
      </p>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {alerts.map((alert) => (
        <article key={alert.id} className={`rounded-2xl border p-4 ${toneClassMap[alert.tone]}`}>
          <h3 className="font-semibold">{alert.title}</h3>
          <p className="mt-2 text-sm opacity-85">{alert.detail}</p>
        </article>
      ))}
    </div>
  </section>
);

export default GovernanceAlerts;
