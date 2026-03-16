import React from 'react';
import type { RepositoryAnalysisResult } from '../../../../../types/analysis';
import { buildSnapshotSummary, formatDuration, MetricCard, riskBadgeClass } from './RepositoryAnalysisShared';

export const RepositoryAnalysisResultView = ({
  result,
  providerName,
}: {
  result: RepositoryAnalysisResult;
  providerName: string;
}) => (
  <>
    <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Resultado</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{result.summary}</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskBadgeClass(result.riskLevel)}`}>
            {result.riskLevel.toUpperCase()}
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <MetricCard label="Score" value={`${result.score}/100`} />
          <MetricCard label="Hallazgos" value={`${result.findings.length}`} />
          <MetricCard label="Archivos analizados" value={`${result.snapshot.filesAnalyzed}`} />
          <MetricCard label="Total descubiertos" value={`${result.snapshot.totalFilesDiscovered}`} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Tiempo snapshot" value={formatDuration(result.snapshot.durationMs)} />
          <MetricCard label="Reintentos" value={`${result.snapshot.retryCount ?? 0}`} />
          <MetricCard label="Descartados por prioridad" value={`${result.snapshot.discardedByPrioritization ?? 0}`} />
          <MetricCard label="Descartados peso/binario" value={`${(result.snapshot.discardedBySize ?? 0) + (result.snapshot.discardedByBinaryDetection ?? 0)}`} />
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p><span className="font-medium text-slate-900">Provider:</span> {providerName}</p>
          <p><span className="font-medium text-slate-900">Repositorio:</span> {result.repository}</p>
          <p><span className="font-medium text-slate-900">Rama:</span> {result.branch}</p>
          <p><span className="font-medium text-slate-900">Modelo:</span> {result.model}</p>
          <p><span className="font-medium text-slate-900">Metricas snapshot:</span> {buildSnapshotSummary(result)}</p>
          {result.snapshot.truncated ? (
            <p className="mt-2 text-amber-700">
              {result.snapshot.partialReason || 'El snapshot fue truncado al maximo configurado de archivos para mantener la corrida utilizable.'}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Top concerns</h2>
        <div className="mt-4 space-y-3">
          {result.topConcerns.map((concern, index) => (
            <div key={`${concern}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {concern}
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-lg font-semibold text-slate-900">Recomendaciones</h3>
        <div className="mt-4 space-y-3">
          {result.recommendations.map((recommendation, index) => (
            <div key={`${recommendation}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              {recommendation}
            </div>
          ))}
        </div>
      </section>
    </section>

    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Hallazgos priorizados</h2>
      <div className="mt-5 space-y-4">
        {result.findings.map((finding) => (
          <article key={finding.id} className="rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskBadgeClass(finding.severity)}`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {finding.category}
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {finding.filePath}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{finding.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{finding.detail}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 lg:max-w-sm">
                <p className="font-medium text-slate-900">Accion sugerida</p>
                <p className="mt-1">{finding.recommendation}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  </>
);
