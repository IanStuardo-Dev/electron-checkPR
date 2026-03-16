import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { RepositoryAnalysisScopeFormProps } from './RepositoryAnalysisForm.types';

type RepositoryAnalysisScopeSelectorsProps = Pick<
  RepositoryAnalysisScopeFormProps,
  | 'repositories'
  | 'repositoryId'
  | 'branchName'
  | 'branches'
  | 'isConnectionReady'
  | 'isLoadingBranches'
  | 'isRunning'
  | 'branchError'
  | 'selectedRepositoryName'
  | 'providerLabel'
  | 'model'
  | 'maxFiles'
  | 'activeDirectives'
  | 'canPreparePreview'
  | 'canRunAnalysis'
  | 'isPreviewing'
  | 'isCancelling'
  | 'resultVisible'
  | 'onRepositoryChange'
  | 'onBranchChange'
  | 'onPreparePreview'
  | 'onRun'
  | 'onCancel'
  | 'onReset'
>;

export const RepositoryAnalysisScopeSelectors = ({
  repositories,
  repositoryId,
  branchName,
  branches,
  isConnectionReady,
  isLoadingBranches,
  isRunning,
  branchError,
  selectedRepositoryName,
  providerLabel,
  model,
  maxFiles,
  activeDirectives,
  canPreparePreview,
  canRunAnalysis,
  isPreviewing,
  isCancelling,
  resultVisible,
  onRepositoryChange,
  onBranchChange,
  onPreparePreview,
  onRun,
  onCancel,
  onReset,
}: RepositoryAnalysisScopeSelectorsProps) => (
  <>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Seleccion de alcance</h2>
        <p className="mt-1 text-sm text-slate-500">
          Selecciona un repositorio y una rama. El analisis usa la configuracion actual de Codex desde Settings.
        </p>
      </div>
      {resultVisible ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
        >
          Limpiar resultado
        </button>
      ) : null}
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="space-y-2 text-sm text-slate-600">
        <span>Repositorio</span>
        <select
          value={repositoryId}
          onChange={(event) => onRepositoryChange(event.target.value)}
          disabled={!isConnectionReady || repositories.length === 0 || isRunning}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Selecciona un repositorio</option>
          {repositories.map((repository) => (
            <option key={repository.id} value={repository.id}>
              {repository.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2 text-sm text-slate-600">
        <span>Rama</span>
        <div className="relative">
          <select
            value={branchName}
            onChange={(event) => onBranchChange(event.target.value)}
            disabled={!isConnectionReady || !repositoryId || isLoadingBranches || branches.length === 0 || isRunning}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {isLoadingBranches ? 'Cargando ramas...' : 'Selecciona una rama'}
            </option>
            {branches.map((branch) => (
              <option key={branch.objectId} value={branch.name}>
                {branch.name}{branch.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </select>
          {isLoadingBranches ? (
            <ArrowPathIcon className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 animate-spin text-slate-400" />
          ) : null}
        </div>
      </label>
    </div>

    {branchError ? (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {branchError}
      </div>
    ) : null}

    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4">
      <div className="text-sm text-slate-600">
        <p><span className="font-medium text-slate-900">Repositorio:</span> {selectedRepositoryName}</p>
        <p><span className="font-medium text-slate-900">Rama:</span> {branchName || 'No seleccionada'}</p>
        <p><span className="font-medium text-slate-900">Provider:</span> {providerLabel}</p>
        <p><span className="font-medium text-slate-900">Modelo:</span> {model}</p>
        <p><span className="font-medium text-slate-900">Max files:</span> {maxFiles}</p>
        <p><span className="font-medium text-slate-900">Politicas activas:</span> {activeDirectives} configuradas</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canPreparePreview}
          onClick={onPreparePreview}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPreviewing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
          {isPreviewing ? 'Preparando snapshot...' : 'Preparar snapshot'}
        </button>
        <button
          type="button"
          disabled={!canRunAnalysis}
          onClick={onRun}
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isRunning ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
          {isRunning ? 'Ejecutando analisis...' : 'Enviar snapshot a Codex'}
        </button>
        {isRunning ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCancelling ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
            {isCancelling ? 'Cancelando...' : 'Cancelar analisis'}
          </button>
        ) : null}
      </div>
    </div>
  </>
);
