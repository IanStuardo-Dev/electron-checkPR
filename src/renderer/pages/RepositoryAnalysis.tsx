import React from 'react';
import { motion } from 'framer-motion';
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { RepositoryBranch } from '../../types/repository';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import { fetchBranches } from '../features/dashboard/ipc';
import { useRepositorySource } from '../features/dashboard/hooks/useAzurePullRequests';
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

  const [repositoryId, setRepositoryId] = React.useState(config.repositoryId || '');
  const [branchName, setBranchName] = React.useState('');
  const [branches, setBranches] = React.useState<RepositoryBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(false);
  const [branchError, setBranchError] = React.useState<string | null>(null);
  const [runRequested, setRunRequested] = React.useState(false);

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
    };

    setIsLoadingBranches(true);
    setBranchError(null);
    void fetchBranches(activeConfig)
      .then((result) => {
        setBranches(result);
        const defaultBranch = result.find((branch) => branch.isDefault)?.name || result[0]?.name || '';
        setBranchName(defaultBranch);
      })
      .catch((error) => {
        setBranches([]);
        setBranchName('');
        setBranchError(error instanceof Error ? error.message : 'No fue posible cargar las ramas.');
      })
      .finally(() => {
        setIsLoadingBranches(false);
      });
  }, [config, isConnectionReady, repositoryId]);

  const canRunAnalysis = Boolean(isConnectionReady && isCodexReady && repositoryId && branchName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Repository Analysis</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Analisis AI por repositorio y rama exacta</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Esta vista prepara la ejecucion futura del analisis Codex sobre un repositorio seleccionado y una rama concreta, independiente del provider.
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
            <p className="pt-2 text-xs text-slate-500">
              No se puede ejecutar ningun analisis hasta que el provider de repositorios y Codex esten listos en Settings.
            </p>
          </div>
        </section>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Seleccion de alcance</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-600">
            <span>Repositorio</span>
            <select
              value={repositoryId}
              onChange={(event) => setRepositoryId(event.target.value)}
              disabled={!isConnectionReady || repositories.length === 0}
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
                onChange={(event) => setBranchName(event.target.value)}
                disabled={!isConnectionReady || !repositoryId || isLoadingBranches || branches.length === 0}
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
            <p><span className="font-medium text-slate-900">Repositorio:</span> {repositoryId ? repositories.find((repo) => repo.id === repositoryId)?.name || repositoryId : 'No seleccionado'}</p>
            <p><span className="font-medium text-slate-900">Rama:</span> {branchName || 'No seleccionada'}</p>
            <p><span className="font-medium text-slate-900">Modelo:</span> {codexConfig.model}</p>
          </div>
          <button
            type="button"
            disabled={!canRunAnalysis}
            onClick={() => setRunRequested(true)}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <SparklesIcon className="h-5 w-5" />
            Run analysis
          </button>
        </div>

        {runRequested ? (
          <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            La ejecucion real del analisis Codex es el siguiente paso. Esta pantalla ya deja listo el flujo y los prerrequisitos de repo + rama + configuracion.
          </div>
        ) : null}
      </section>
    </motion.div>
  );
};

const StatusRow = ({ label, value, ok }: { label: string; value: string; ok: boolean }) => (
  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
    <span>{label}</span>
    <span className={`font-medium ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{value}</span>
  </div>
);

export default RepositoryAnalysis;
