import React from 'react';
import { loadDashboardHistory, loadHistoryCharts } from '../../features/history';

const HistoryCharts = React.lazy(async () => ({
  default: (await loadHistoryCharts()).default,
}));

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
            <React.Suspense fallback={<HistoryChartsFallback />}>
              <HistoryCharts history={history} />
            </React.Suspense>
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

export default History;

const HistoryChartsFallback = () => (
  <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-lg ring-1 ring-slate-200">
    <p className="text-sm font-medium text-slate-900">Cargando visualizaciones historicas</p>
    <p className="mt-2 text-sm text-slate-500">Preparando los graficos del backlog y de la cobertura de review.</p>
  </div>
);

function formatTooltipDate(value: string): string {
  return new Date(value).toLocaleString();
}
