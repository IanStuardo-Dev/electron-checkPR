import React from 'react';
import type { BranchInsight, RepositoryInsight, ReviewerInsight } from '../../../../shared/dashboard/summary.types';

interface InsightsPanelProps {
  repositoryInsights: RepositoryInsight[];
  branchInsights: BranchInsight[];
  reviewerInsights: ReviewerInsight[];
  noDescriptionCount: number;
}

const InsightsPanel = ({
  repositoryInsights,
  branchInsights,
  reviewerInsights,
  noDescriptionCount,
}: InsightsPanelProps) => (
  <div className="space-y-6">
    <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Repos con más presión</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        {repositoryInsights.length === 0 ? (
          <EmptyState message="Sin datos de repositorios todavía." />
        ) : (
          repositoryInsights.map((repo) => (
            <div key={repo.name} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{repo.name}</span>
                <span>{repo.total} PRs</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {repo.highRisk} con riesgo alto, {repo.blocked} bloqueados
              </p>
            </div>
          ))
        )}
      </div>
    </div>

    <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Uso de ramas</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        {branchInsights.length === 0 ? (
          <EmptyState message="Sin datos de ramas todavía." />
        ) : (
          branchInsights.map((branch) => (
            <div key={branch.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>{branch.label}</span>
              <span className="font-semibold text-slate-900">{branch.total}</span>
            </div>
          ))
        )}
      </div>
    </div>

    <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Carga por reviewer</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        {reviewerInsights.length === 0 ? (
          <EmptyState message="Sin reviewers pendientes todavía." />
        ) : (
          reviewerInsights.map((reviewer) => (
            <div key={reviewer.reviewer} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>{reviewer.reviewer}</span>
              <span className="font-semibold text-slate-900">{reviewer.pending}</span>
            </div>
          ))
        )}
      </div>
    </div>

    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
      <h2 className="text-xl font-semibold">Señales que importan</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-300">
        <p>{noDescriptionCount} PRs sin descripción suficiente para review efectivo.</p>
        <p>El uso de ramas permite detectar si el flujo está dominado por `feature/*`, `hotfix/*` o `release/*`.</p>
        <p>La presión por repositorio y reviewer ayuda a repartir carga antes de que la cola se estanque.</p>
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
    {message}
  </div>
);

export default InsightsPanel;
