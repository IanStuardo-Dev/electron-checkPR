import React from 'react';
import { ArrowPathIcon, ShieldExclamationIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { PullRequestAnalysisPreview } from '../../../../../types/analysis';
import type { PrioritizedPullRequest } from '../../../../../types/repository';
import PullRequestAiPreviewCard from './PullRequestAiPreviewCard';

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
              {previews.map((preview) => (
                <PullRequestAiPreviewCard
                  key={preview.pullRequestId}
                  preview={preview}
                  pullRequest={selectedPullRequests.find((pullRequest) => pullRequest.id === preview.pullRequestId)}
                />
              ))}

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
