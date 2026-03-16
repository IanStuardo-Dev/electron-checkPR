import React from 'react';
import { ArrowPathIcon, ShieldExclamationIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { PullRequestAnalysisPreview } from '../../../../types/analysis';
import type { PrioritizedPullRequest } from '../types';

interface PullRequestAiReviewModalProps {
  isOpen: boolean;
  previews: PullRequestAnalysisPreview[];
  selectedPullRequests: PrioritizedPullRequest[];
  snapshotAcknowledged: boolean;
  onToggleAcknowledgement: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPreviewing: boolean;
  isSubmitting: boolean;
  error: string | null;
  canConfirm: boolean;
}

const PullRequestAiReviewModal = ({
  isOpen,
  previews,
  selectedPullRequests,
  snapshotAcknowledged,
  onToggleAcknowledgement,
  onClose,
  onConfirm,
  onCancel,
  isPreviewing,
  isSubmitting,
  error,
  canConfirm,
}: PullRequestAiReviewModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="my-3 flex max-h-[min(92vh,980px)] w-full max-w-5xl min-h-0 flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">PR AI Review</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Revision local del snapshot antes de enviar a Codex</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta vista prepara un snapshot local del PR y muestra cobertura, sensibilidad y disclaimer antes de cualquier envio externo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {isPreviewing ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-slate-600">
              <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-sky-600" />
              <p className="mt-4 text-lg font-medium text-slate-900">Preparando snapshot local de PRs</p>
              <p className="mt-2 text-sm">Se esta revisando cobertura, archivos sensibles y diff textual antes del envio.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {previews.map((preview) => {
                const selected = selectedPullRequests.find((pullRequest) => pullRequest.id === preview.pullRequestId);
                const blocked = preview.lacksPatchCoverage || preview.strictModeWouldBlock;
                return (
                  <article key={preview.pullRequestId} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{preview.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          #{preview.pullRequestId} · {preview.repository} · {selected?.sourceBranch} → {selected?.targetBranch}
                        </p>
                      </div>
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {blocked ? 'Bloqueado para envio' : 'Listo para enviar'}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">{preview.disclaimer}</p>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Archivos preparados</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{preview.filesPrepared}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total cambiados</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{preview.totalFilesChanged}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sensibilidad</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{preview.sensitivity.summary}</p>
                      </div>
                    </div>

                    {preview.partialReason ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {preview.partialReason}
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Muestra de archivos incluidos</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preview.includedFiles.length > 0 ? preview.includedFiles.map((path) => (
                            <span key={path} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                              {path}
                            </span>
                          )) : (
                            <span className="text-sm text-slate-500">No hay archivos con diff textual suficiente.</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Hallazgos locales</p>
                        {preview.sensitivity.findings.length === 0 ? (
                          <p className="mt-3 text-sm text-emerald-700">No se detectaron patrones sensibles evidentes.</p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {preview.sensitivity.findings.map((finding) => (
                              <div key={`${finding.kind}-${finding.path}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                                <p className="font-medium text-slate-900">{finding.path}</p>
                                <p className="mt-1">{finding.reason}</p>
                                {typeof finding.lineNumber === 'number' ? (
                                  <p className="mt-1 text-xs text-slate-500">Linea {finding.lineNumber}</p>
                                ) : null}
                                {finding.codeSnippet ? (
                                  <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-100">{finding.codeSnippet}</pre>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={snapshotAcknowledged}
                  onChange={(event) => onToggleAcknowledgement(event.target.checked)}
                />
                <span>
                  Entiendo que el siguiente paso enviara el diff textual preparado a Codex para analisis IA externo.
                  Si el snapshot no tiene cobertura suficiente o expone sensibilidad bajo modo estricto, el envio queda bloqueado.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-slate-500">
            {selectedPullRequests.length} PRs preparados para revision manual.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              Cerrar
            </button>
            {isSubmitting ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:text-rose-800"
              >
                <ShieldExclamationIcon className="h-4 w-4" />
                Cancelar analisis
              </button>
            ) : null}
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm || isPreviewing || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
              {isSubmitting ? 'Enviando a Codex...' : 'Enviar snapshot a Codex'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PullRequestAiReviewModal;
