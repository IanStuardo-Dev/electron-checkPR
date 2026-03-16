import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import type { RepositoryAnalysisScopeFormProps } from './RepositoryAnalysisForm.types';

type RepositoryAnalysisSnapshotPreviewProps = Pick<
  RepositoryAnalysisScopeFormProps,
  | 'preview'
  | 'strictModeEnabled'
  | 'strictModeBlocked'
  | 'pendingExcludedPaths'
  | 'snapshotAcknowledged'
  | 'onToggleExcludedPath'
  | 'onRegenerateWithExclusions'
  | 'onToggleAcknowledgement'
  | 'isPreviewing'
  | 'isRunning'
>;

function PreviewList({
  title,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  tone: 'sky' | 'amber' | 'rose' | 'slate';
  items: string[];
  emptyLabel: string;
}) {
  const toneClassName = {
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    slate: 'border-slate-200 bg-slate-100 text-slate-900',
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1 text-xs leading-5">
        {items.length > 0 ? items.map((item) => (
          <p key={item} className="break-all rounded-xl bg-white/70 px-3 py-2">{item}</p>
        )) : <p>{emptyLabel}</p>}
      </div>
    </div>
  );
}

export const RepositoryAnalysisSnapshotPreview = ({
  preview,
  strictModeEnabled,
  strictModeBlocked,
  pendingExcludedPaths,
  snapshotAcknowledged,
  onToggleExcludedPath,
  onRegenerateWithExclusions,
  onToggleAcknowledgement,
  isPreviewing,
  isRunning,
}: RepositoryAnalysisSnapshotPreviewProps) => {
  if (!preview) {
    return null;
  }

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Preflight</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Revision previa del snapshot</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{preview.disclaimer}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          <p><span className="font-medium text-slate-900">Archivos preparados:</span> {preview.filesPrepared}</p>
          <p><span className="font-medium text-slate-900">Descubiertos:</span> {preview.totalFilesDiscovered}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <PreviewList
          title="Archivos incluidos"
          tone="sky"
          items={preview.includedFiles}
          emptyLabel="No hay muestra disponible."
        />
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <PreviewList
            title="Fuera por prioridad"
            tone="amber"
            items={preview.exclusions.omittedByPrioritization}
            emptyLabel="Sin exclusiones por prioridad."
          />
          <PreviewList
            title="Fuera por tamano"
            tone="rose"
            items={preview.exclusions.omittedBySize}
            emptyLabel="Sin exclusiones por tamano."
          />
          <PreviewList
            title="Fuera por binario"
            tone="slate"
            items={preview.exclusions.omittedByBinaryDetection}
            emptyLabel="Sin exclusiones por contenido binario."
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Analisis local de sensibilidad</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{preview.sensitivity.summary}</p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${
            preview.sensitivity.hasSecretPatterns
              ? 'bg-rose-50 text-rose-700'
              : preview.sensitivity.hasSensitiveConfigFiles
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-emerald-700'
          }`}>
            {preview.sensitivity.hasSecretPatterns
              ? 'Posible riesgo alto'
              : preview.sensitivity.hasSensitiveConfigFiles
                ? 'Revisar config sensible'
                : 'Sin señales sensibles'}
          </div>
        </div>

        {preview.sensitivity.noSensitiveConfigFilesDetected ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            No se detectaron archivos sensibles de configuracion en el snapshot preparado.
          </div>
        ) : null}

        {preview.sensitivity.findings.length > 0 ? (
          <div className="mt-4 space-y-3">
            {preview.sensitivity.findings.map((finding) => (
              <div
                key={`${finding.kind}-${finding.path}`}
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  finding.kind === 'secret-pattern'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-medium">{finding.path}</p>
                    <p className="mt-1">{finding.reason} ({finding.confidence})</p>
                  </div>
                  <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-current/20 bg-white/60 px-3 py-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={pendingExcludedPaths.includes(finding.path)}
                      onChange={(event) => onToggleExcludedPath(finding.path, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Excluir del snapshot
                  </label>
                </div>
                {finding.lineNumber ? (
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em]">
                    Linea sospechosa: {finding.lineNumber}
                  </p>
                ) : null}
                {finding.codeSnippet ? (
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-slate-900">
                    {finding.codeSnippet}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {preview.sensitivity.findings.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-900">Exclusiones temporales para esta corrida</p>
              <p className="mt-1">
                {pendingExcludedPaths.length > 0
                  ? `${pendingExcludedPaths.length} archivo(s) seleccionado(s) para excluir y regenerar el snapshot una sola vez.`
                  : 'Selecciona uno o varios archivos sospechosos si quieres regenerar el snapshot sin enviarlos a Codex.'}
              </p>
            </div>
            <button
              type="button"
              disabled={pendingExcludedPaths.length === 0 || isPreviewing || isRunning}
              onClick={onRegenerateWithExclusions}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPreviewing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
              Regenerar snapshot con exclusiones
            </button>
          </div>
        ) : null}
      </div>

      {strictModeEnabled && strictModeBlocked ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
          El modo estricto esta activo. Debes ajustar exclusiones o limpiar el snapshot antes de enviarlo a Codex.
        </div>
      ) : null}

      {preview.partialReason ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {preview.partialReason}
        </div>
      ) : null}

      <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 ring-1 ring-slate-100">
        <input
          type="checkbox"
          checked={snapshotAcknowledged}
          onChange={(event) => onToggleAcknowledgement(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <span>
          Confirmo que revise el disclaimer y las exclusiones del snapshot. Autorizo enviar este contexto a Codex para el analisis remoto.
        </span>
      </label>
    </div>
  );
};
