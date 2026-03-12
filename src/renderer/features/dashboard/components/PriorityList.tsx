import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { OperationalPullRequest } from '../types';
import { getRiskBadgeClass } from '../metrics';

interface PriorityListProps {
  pullRequests: OperationalPullRequest[];
  onOpenPullRequest: (url: string) => void;
  onPreviewQueueAi: () => void;
  onPreviewPullRequestAi: (pullRequestId: number) => void;
  isAiConfigured: boolean;
  isPreviewingAi: boolean;
  isSubmittingAi: boolean;
}

const PriorityList = ({
  pullRequests,
  onOpenPullRequest,
  onPreviewQueueAi,
  onPreviewPullRequestAi,
  isAiConfigured,
  isPreviewingAi,
  isSubmittingAi,
}: PriorityListProps) => (
  <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">PRs priorizados</h2>
        <p className="text-sm text-slate-500">Ordenados por riesgo operativo, contexto y antigüedad.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-500">{pullRequests.length} elementos</div>
        <button
          type="button"
          onClick={onPreviewQueueAi}
          disabled={!isAiConfigured || isPreviewingAi || isSubmittingAi || pullRequests.length === 0}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {isPreviewingAi ? 'Preparando snapshot...' : 'Preparar revision IA'}
        </button>
      </div>
    </div>

    <div className="space-y-4">
      {pullRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          Completa la conexión del provider activo y sincroniza para ver Pull Requests reales.
        </div>
      ) : (
        pullRequests.slice(0, 8).map((pr) => (
          <article
            key={pr.id}
            className="rounded-2xl border border-slate-200 p-5 transition hover:border-sky-300 hover:bg-sky-50/40"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    {pr.repository}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskBadgeClass(pr.riskScore)}`}>
                    Riesgo {pr.riskScore}
                  </span>
                  {pr.isDraft ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">Draft</span>
                  ) : null}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{pr.title}</h3>
                  <p className="text-sm text-slate-500">
                    #{pr.id} abierto por {pr.createdBy.displayName} hace {pr.ageHours}h
                  </p>
                </div>
                <p className="text-sm text-slate-600">{pr.description}</p>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      pr.aiReview.status === 'analyzed'
                        ? (pr.aiReview.riskScore ?? 0) >= 75
                          ? 'bg-rose-100 text-rose-700'
                          : (pr.aiReview.riskScore ?? 0) >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        : pr.aiReview.status === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : pr.aiReview.status === 'omitted'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                    }`}>
                      {pr.aiReview.status === 'analyzed'
                        ? `AI ${pr.aiReview.riskScore}/100`
                        : pr.aiReview.status === 'error'
                          ? 'AI error'
                          : pr.aiReview.status === 'omitted'
                            ? 'AI omitido'
                            : pr.aiReview.status === 'queued'
                              ? 'AI pendiente'
                              : 'Sin analizar'}
                    </span>
                    {pr.aiReview.coverageNote ? (
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                        Snapshot parcial
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {pr.aiReview.shortSummary || (pr.aiReview.status === 'not-configured'
                      ? 'Codex no configurado para enriquecer este PR con IA.'
                      : pr.aiReview.error || 'La revisión IA todavía no generó un resumen para este PR.')}
                  </p>
                  {pr.aiReview.topConcerns.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pr.aiReview.topConcerns.slice(0, 2).map((concern: string) => (
                        <span key={concern} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {concern}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{pr.sourceBranch} → {pr.targetBranch}</span>
                  <span>{pr.approvals} approvals</span>
                  <span>{pr.pendingReviewers} reviewers pendientes</span>
                  <span>merge: {pr.mergeStatus}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenPullRequest(pr.url)}
                className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
              >
                Abrir PR
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onPreviewPullRequestAi(pr.id)}
                disabled={!isAiConfigured || isPreviewingAi || isSubmittingAi}
                className="inline-flex items-center justify-center self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                {isPreviewingAi
                  ? 'Preparando...'
                  : pr.aiReview.status === 'analyzed'
                    ? 'Revisar snapshot IA'
                    : 'Preparar snapshot IA'}
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  </div>
);

export default PriorityList;
