import React from 'react';
import type { PullRequestAnalysisPreview } from '../../../../../types/analysis';
import type { PrioritizedPullRequest } from '../../../../../types/repository';

interface PullRequestAiPreviewCardProps {
  preview: PullRequestAnalysisPreview;
  pullRequest: PrioritizedPullRequest | undefined;
}

const PullRequestAiPreviewCard = ({
  preview,
  pullRequest,
}: PullRequestAiPreviewCardProps) => {
  const blocked = preview.lacksPatchCoverage || preview.strictModeWouldBlock;

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{preview.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            #{preview.pullRequestId} · {preview.repository} · {pullRequest?.sourceBranch} → {pullRequest?.targetBranch}
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
};

export default PullRequestAiPreviewCard;
