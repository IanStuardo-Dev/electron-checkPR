import React from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { DashboardMetric } from '../../../../shared/dashboard/summary.types';

interface MetricsGridProps {
  metrics: DashboardMetric[];
}

const toneClassMap: Record<DashboardMetric['tone'], string> = {
  sky: 'from-sky-50 to-white text-sky-700 ring-sky-100',
  amber: 'from-amber-50 to-white text-amber-700 ring-amber-100',
  rose: 'from-rose-50 to-white text-rose-700 ring-rose-100',
  emerald: 'from-emerald-50 to-white text-emerald-700 ring-emerald-100',
};

const iconMap: Record<string, React.ReactNode> = {
  'active-prs': <DocumentTextIcon className="h-6 w-6 text-sky-600" />,
  'high-risk': <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />,
  blocked: <ShieldCheckIcon className="h-6 w-6 text-rose-600" />,
  'reviewer-workload': <UserGroupIcon className="h-6 w-6 text-emerald-600" />,
  repositories: <FolderIcon className="h-6 w-6 text-sky-600" />,
  'average-age': <ClockIcon className="h-6 w-6 text-amber-600" />,
  drafts: <DocumentTextIcon className="h-6 w-6 text-rose-600" />,
  approved: <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />,
};

const MetricsGrid = ({ metrics }: MetricsGridProps) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map((metric) => (
      <div
        key={metric.id}
        className={`rounded-3xl bg-gradient-to-br ${toneClassMap[metric.tone]} p-5 shadow-lg ring-1`}
      >
        <div className="flex items-center justify-between">
          <div className="rounded-2xl bg-white/80 p-3 shadow-sm">{iconMap[metric.id]}</div>
          <div className="text-4xl font-semibold">{metric.value}</div>
        </div>
        <div className="mt-6">
          <h3 className="text-base font-semibold text-slate-900">{metric.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{metric.detail}</p>
        </div>
      </div>
    ))}
  </div>
);

export default MetricsGrid;
