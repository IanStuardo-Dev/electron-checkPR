import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { LoaderStep, StatusRow } from './RepositoryAnalysisShared';

export const RepositoryAnalysisHero = () => (
  <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Repository Analysis</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Analisis AI sobre una rama exacta</h1>
    <p className="mt-3 max-w-3xl text-sm text-slate-300">
      Ejecuta un analisis real sobre el snapshot del repositorio y recibe hallazgos accionables de seguridad, arquitectura,
      mantenibilidad, performance y testing.
    </p>
  </section>
);

export const RepositoryAnalysisPrerequisites = ({
  providerLabel,
  providerReady,
  codexReady,
  codexModelLabel,
  phaseLabel,
  phaseOk,
}: {
  providerLabel: string;
  providerReady: boolean;
  codexReady: boolean;
  codexModelLabel: string;
  phaseLabel: string;
  phaseOk: boolean;
}) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <h2 className="text-xl font-semibold text-slate-900">Prerequisitos</h2>
    <div className="mt-4 space-y-3 text-sm text-slate-600">
      <StatusRow label="Provider" value={providerLabel} ok={providerReady} />
      <StatusRow
        label="Codex Integration"
        value={codexReady ? codexModelLabel : 'Configurar API key y habilitar integracion'}
        ok={codexReady}
      />
      <StatusRow label="Ejecucion" value={phaseLabel} ok={phaseOk} />
    </div>
  </section>
);

export const RepositoryAnalysisLoader = ({ phase }: { phase: 'preparing' | 'analyzing' | 'cancelling' }) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="flex items-start gap-4">
      <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
        <ArrowPathIcon className="h-6 w-6 animate-spin" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Analisis en progreso</h2>
        <p className="mt-2 text-sm text-slate-600">
          {phase === 'preparing'
            ? 'Estamos reuniendo el snapshot del repositorio y preparando el contexto para Codex.'
            : phase === 'cancelling'
              ? 'Estamos abortando la solicitud remota y liberando el estado para que puedas reintentar.'
              : 'Codex esta razonando sobre el estado actual de la rama y generando hallazgos estructurados.'}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <LoaderStep label="Snapshot" active done={phase !== 'preparing'} />
          <LoaderStep label="Analisis" active={phase !== 'preparing'} done={phase === 'cancelling'} />
          <LoaderStep label="Reporte" active={false} done={false} />
        </div>
      </div>
    </div>
  </section>
);

export const RepositoryAnalysisError = ({ error }: { error: string }) => (
  <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-lg">
    <div className="flex items-start gap-3">
      <ExclamationTriangleIcon className="mt-0.5 h-6 w-6" />
      <div>
        <h2 className="text-lg font-semibold">No fue posible ejecutar el analisis</h2>
        <div className="mt-2 rounded-2xl border border-rose-200 bg-white/70 px-4 py-3">
          <pre className="whitespace-pre-wrap break-words text-sm font-medium text-rose-900">{error}</pre>
        </div>
      </div>
    </div>
  </section>
);

export const RepositoryAnalysisEmptyState = () => (
  <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-lg ring-1 ring-slate-200">
    Selecciona un repositorio y una rama para ejecutar el primer analisis real.
  </section>
);
