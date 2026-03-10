import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { loadDashboardHistory } from '../features/dashboard/history';

const History = () => {
  const history = React.useMemo(() => loadDashboardHistory().slice().reverse(), []);

  const latest = history[history.length - 1];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Histórico de seguimiento</h1>
        <p className="mt-2 text-sm text-slate-500">
          Snapshot local de cada sincronización exitosa para analizar evolución del backlog y riesgo.
        </p>
        {latest ? (
          <p className="mt-3 text-sm text-slate-600">Último alcance sincronizado: {latest.scopeLabel}</p>
        ) : null}
      </section>

      {history.length === 0 ? (
        <section className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-lg ring-1 ring-slate-200">
          Todavía no hay histórico. Sincroniza el dashboard al menos una vez para empezar a guardar snapshots.
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Evolución del backlog</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="capturedAt" tickFormatter={formatDateTick} />
                    <YAxis />
                    <Tooltip labelFormatter={formatTooltipDate} />
                    <Area type="monotone" dataKey="activePRs" stroke="#0284c7" fill="#bae6fd" name="PRs activos" />
                    <Area type="monotone" dataKey="highRiskPRs" stroke="#f59e0b" fill="#fde68a" name="PRs con riesgo" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Bloqueos y backlog de review</h2>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="capturedAt" tickFormatter={formatDateTick} />
                    <YAxis />
                    <Tooltip labelFormatter={formatTooltipDate} />
                    <Bar dataKey="blockedPRs" fill="#f43f5e" name="Bloqueados" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="reviewBacklog" fill="#10b981" name="Backlog review" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Últimos snapshots</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Activos</th>
                    <th className="px-4 py-3">Riesgo</th>
                    <th className="px-4 py-3">Bloqueados</th>
                    <th className="px-4 py-3">Stale</th>
                    <th className="px-4 py-3">Edad prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().slice(0, 15).map((snapshot) => (
                    <tr key={snapshot.id} className="border-t border-slate-100 text-slate-700">
                      <td className="px-4 py-3">{formatTooltipDate(snapshot.capturedAt)}</td>
                      <td className="px-4 py-3">{snapshot.scopeLabel}</td>
                      <td className="px-4 py-3">{snapshot.activePRs}</td>
                      <td className="px-4 py-3">{snapshot.highRiskPRs}</td>
                      <td className="px-4 py-3">{snapshot.blockedPRs}</td>
                      <td className="px-4 py-3">{snapshot.stalePRs}</td>
                      <td className="px-4 py-3">{snapshot.averageAgeHours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

function formatDateTick(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default History;
