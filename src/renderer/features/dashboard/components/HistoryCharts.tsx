import React from 'react';
import { AreaChart } from 'recharts/es6/chart/AreaChart';
import { BarChart } from 'recharts/es6/chart/BarChart';
import { Area } from 'recharts/es6/cartesian/Area';
import { Bar } from 'recharts/es6/cartesian/Bar';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import type { DashboardHistorySnapshot } from '../history';

interface HistoryChartsProps {
  history: DashboardHistorySnapshot[];
}

const HistoryCharts = ({ history }: HistoryChartsProps) => (
  <>
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
  </>
);

function formatDateTick(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTooltipDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default HistoryCharts;
