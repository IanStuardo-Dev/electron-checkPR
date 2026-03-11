import React from 'react';
import { motion } from 'framer-motion';
import { ArrowPathIcon, ExclamationTriangleIcon, ShieldExclamationIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { RepositoryBranch } from '../../types/repository';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import { fetchBranches } from '../features/dashboard/ipc';
import { useRepositorySource } from '../features/dashboard/hooks/useAzurePullRequests';
import { useRepositoryAnalysis } from '../features/repository-analysis/hooks/useRepositoryAnalysis';
import { useCodexSettings } from '../features/settings/hooks/useCodexSettings';

const RepositoryAnalysis = () => {
  const {
    activeProvider,
    config,
    isConnectionReady,
    repositories,
    selectedProjectName,
    selectedRepositoryName,
    summary,
  } = useRepositorySource();
  const { config: codexConfig, isReady: isCodexReady } = useCodexSettings();
  const { phase, result, error, isRunning, execute, reset } = useRepositoryAnalysis();

  const [repositoryId, setRepositoryId] = React.useState(config.repositoryId || '');
  const [branchName, setBranchName] = React.useState('');
  const [branches, setBranches] = React.useState<RepositoryBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(false);
  const [branchError, setBranchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRepositoryId(config.repositoryId || '');
  }, [config.repositoryId]);

  React.useEffect(() => {
    if (!isConnectionReady || !repositoryId) {
      setBranches([]);
      setBranchName('');
      return;
    }

    const activeConfig = {
      ...config,
      repositoryId,
      project: repositoryId,
    };

    setIsLoadingBranches(true);
    setBranchError(null);
    void fetchBranches(activeConfig)
      .then((nextBranches) => {
        setBranches(nextBranches);
        const defaultBranch = nextBranches.find((branch) => branch.isDefault)?.name || nextBranches[0]?.name || '';
        setBranchName(defaultBranch);
      })
      .catch((nextError) => {
        setBranches([]);
        setBranchName('');
        setBranchError(nextError instanceof Error ? nextError.message : 'No fue posible cargar las ramas.');
      })
      .finally(() => {
        setIsLoadingBranches(false);
      });
  }, [config, isConnectionReady, repositoryId]);

  const selectedRepository = repositories.find((repository) => repository.id === repositoryId);
  const canRunAnalysis = Boolean(isConnectionReady && isCodexReady && repositoryId && branchName && !isRunning);

  const handleRun = React.useCallback(() => {
    if (!canRunAnalysis) {
      return;
    }

    void execute({
      source: {
        ...config,
        repositoryId,
        project: activeProvider.kind === 'azure-devops' ? config.project : repositoryId,
      },
      repositoryId,
      branchName,
      model: codexConfig.model,
      apiKey: codexConfig.apiKey,
      analysisDepth: codexConfig.analysisDepth,
      maxFilesPerRun: codexConfig.maxFilesPerRun,
      includeTests: codexConfig.includeTests,
    });
  }, [activeProvider.kind, branchName, canRunAnalysis, codexConfig, config, execute, repositoryId]);

  const phaseLabel = phase === 'preparing'
    ? 'Preparando snapshot del repositorio'
    : phase === 'analyzing'
      ? 'Codex esta analizando la rama seleccionada'
      : 'Listo para ejecutar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Repository Analysis</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Analisis AI sobre una rama exacta</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Ejecuta un analisis real sobre el snapshot del repositorio y recibe hallazgos accionables de seguridad, arquitectura,
          mantenibilidad, performance y testing.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <ConnectionSummary
          providerKind={activeProvider.kind}
          providerName={activeProvider.name}
          scopeLabel={summary.scopeLabel}
          projectName={selectedProjectName}
          repositoryName={selectedRepositoryName}
          isConnected={isConnectionReady}
        />

        <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Prerequisitos</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <StatusRow
              label={activeProvider.name}
              value={isConnectionReady ? 'Listo' : 'Pendiente'}
              ok={isConnectionReady}
            />
            <StatusRow
              label="Codex Integration"
              value={isCodexReady ? `${codexConfig.model} listo` : 'Configurar API key y habilitar integracion'}
              ok={isCodexReady}
            />
            <StatusRow
              label="Ejecucion"
              value={phaseLabel}
              ok={phase === 'completed' || phase === 'idle'}
            />
          </div>
        </section>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Seleccion de alcance</h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona un repositorio y una rama. El analisis usa la configuracion actual de Codex desde Settings.
            </p>
          </div>
          {result ? (
            <button
              type="button"
              onClick={reset}
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
              onChange={(event) => {
                setRepositoryId(event.target.value);
                reset();
              }}
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
                onChange={(event) => {
                  setBranchName(event.target.value);
                  reset();
                }}
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
            <p><span className="font-medium text-slate-900">Repositorio:</span> {selectedRepository?.name || 'No seleccionado'}</p>
            <p><span className="font-medium text-slate-900">Rama:</span> {branchName || 'No seleccionada'}</p>
            <p><span className="font-medium text-slate-900">Modelo:</span> {codexConfig.model}</p>
            <p><span className="font-medium text-slate-900">Max files:</span> {codexConfig.maxFilesPerRun}</p>
          </div>
          <button
            type="button"
            disabled={!canRunAnalysis}
            onClick={handleRun}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRunning ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
            {isRunning ? 'Ejecutando analisis...' : 'Run analysis'}
          </button>
        </div>
      </section>

      {isRunning ? (
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
                  : 'Codex esta razonando sobre el estado actual de la rama y generando hallazgos estructurados.'}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <LoaderStep label="Snapshot" active={phase === 'preparing' || phase === 'analyzing'} done={phase === 'analyzing'} />
                <LoaderStep label="Analisis" active={phase === 'analyzing'} done={false} />
                <LoaderStep label="Reporte" active={false} done={false} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
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
      ) : null}

      {result ? (
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
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p><span className="font-medium text-slate-900">Provider:</span> {activeProvider.name}</p>
                <p><span className="font-medium text-slate-900">Repositorio:</span> {result.repository}</p>
                <p><span className="font-medium text-slate-900">Rama:</span> {result.branch}</p>
                <p><span className="font-medium text-slate-900">Modelo:</span> {result.model}</p>
                {result.snapshot.truncated ? (
                  <p className="mt-2 text-amber-700">
                    El snapshot fue truncado al maximo configurado de archivos para mantener la corrida utilizable.
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
      ) : !isRunning && !error ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-lg ring-1 ring-slate-200">
          Selecciona un repositorio y una rama para ejecutar el primer analisis real.
        </section>
      ) : null}
    </motion.div>
  );
};

const StatusRow = ({ label, value, ok }: { label: string; value: string; ok: boolean }) => (
  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
    <span>{label}</span>
    <span className={`font-medium ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{value}</span>
  </div>
);

const LoaderStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className={`rounded-2xl border px-4 py-3 text-sm ${
    done
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : active
        ? 'border-sky-200 bg-sky-50 text-sky-700'
        : 'border-slate-200 bg-slate-50 text-slate-500'
  }`}>
    <div className="flex items-center gap-2">
      {done ? <ShieldExclamationIcon className="h-4 w-4" /> : active ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
      <span>{label}</span>
    </div>
  </div>
);

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

function riskBadgeClass(value: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (value) {
    case 'critical':
      return 'bg-rose-100 text-rose-700';
    case 'high':
      return 'bg-amber-100 text-amber-700';
    case 'medium':
      return 'bg-sky-100 text-sky-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
}

export default RepositoryAnalysis;
