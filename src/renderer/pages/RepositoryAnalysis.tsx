import React from 'react';
import { motion } from 'framer-motion';
import type { RepositoryBranch } from '../../types/repository';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import { fetchBranches } from '../features/dashboard/ipc';
import { useRepositorySourceContext } from '../features/dashboard/context/RepositorySourceContext';
import { useRepositoryAnalysis } from '../features/repository-analysis/hooks/useRepositoryAnalysis';
import { useCodexSettings } from '../features/settings/hooks/useCodexSettings';
import {
  countActiveDirectives,
  RepositoryAnalysisEmptyState,
  RepositoryAnalysisError,
  RepositoryAnalysisHero,
  RepositoryAnalysisLoader,
  RepositoryAnalysisPrerequisites,
  RepositoryAnalysisResultView,
  RepositoryAnalysisScopeForm,
} from '../features/repository-analysis/components/RepositoryAnalysisSections';

const RepositoryAnalysis = () => {
  const {
    activeProvider,
    activeProviderName,
    config,
    isConnectionReady,
    repositories,
    selectedProjectName,
    selectedRepositoryName,
    summary,
  } = useRepositorySourceContext();
  const { config: codexConfig, isReady: isCodexReady } = useCodexSettings();
  const { phase, result, error, isRunning, isCancelling, execute, cancel, reset } = useRepositoryAnalysis();

  const [repositoryId, setRepositoryId] = React.useState(config.repositoryId || '');
  const [branchName, setBranchName] = React.useState('');
  const [branches, setBranches] = React.useState<RepositoryBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(false);
  const [branchError, setBranchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRepositoryId(config.repositoryId || '');
  }, [config.repositoryId]);

  React.useEffect(() => {
    if (!config.provider || !isConnectionReady || !repositoryId) {
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
  const canRunAnalysis = Boolean(config.provider && activeProvider && isConnectionReady && isCodexReady && repositoryId && branchName && !isRunning);

  const handleRun = React.useCallback(() => {
    if (!canRunAnalysis) {
      return;
    }

    void execute({
      requestId: `${Date.now()}-${repositoryId}-${branchName}`,
      source: {
        ...config,
        provider: activeProvider!.kind,
        repositoryId,
        project: activeProvider!.kind === 'azure-devops' ? config.project : repositoryId,
      },
      repositoryId,
      branchName,
      model: codexConfig.model,
      apiKey: codexConfig.apiKey,
      analysisDepth: codexConfig.analysisDepth,
      maxFilesPerRun: codexConfig.maxFilesPerRun,
      includeTests: codexConfig.includeTests,
      timeoutMs: 90_000,
      promptDirectives: codexConfig.promptDirectives,
    });
  }, [activeProvider, branchName, canRunAnalysis, codexConfig, config, execute, repositoryId]);

  const phaseLabel = phase === 'preparing'
    ? 'Preparando snapshot del repositorio'
    : phase === 'analyzing'
      ? 'Codex esta analizando la rama seleccionada'
      : phase === 'cancelling'
        ? 'Cancelando corrida actual'
      : 'Listo para ejecutar';

  const loaderPhase: 'preparing' | 'analyzing' | 'cancelling' = phase === 'analyzing'
    ? 'analyzing'
    : phase === 'cancelling'
      ? 'cancelling'
      : 'preparing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <RepositoryAnalysisHero />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
        <ConnectionSummary
          providerKind={activeProvider?.kind}
          providerName={activeProviderName}
          scopeLabel={summary.scopeLabel}
          projectName={selectedProjectName}
          repositoryName={selectedRepositoryName}
          isConnected={isConnectionReady}
          empty={!config.provider}
        />

        <RepositoryAnalysisPrerequisites
          providerLabel={config.provider ? activeProviderName : 'No seleccionado'}
          providerReady={Boolean(config.provider && isConnectionReady)}
          codexReady={isCodexReady}
          codexModelLabel={`${codexConfig.model} listo`}
          phaseLabel={phaseLabel}
          phaseOk={phase === 'completed' || phase === 'idle'}
        />
      </section>

      <RepositoryAnalysisScopeForm
        repositories={repositories}
        repositoryId={repositoryId}
        branchName={branchName}
        branches={branches}
        isConnectionReady={isConnectionReady}
        isLoadingBranches={isLoadingBranches}
        isRunning={isRunning}
        branchError={branchError}
        selectedRepositoryName={selectedRepository?.name || 'No seleccionado'}
        providerLabel={config.provider ? activeProviderName : 'No seleccionado'}
        model={codexConfig.model}
        maxFiles={codexConfig.maxFilesPerRun}
        activeDirectives={countActiveDirectives(codexConfig)}
        canRunAnalysis={canRunAnalysis}
        isCancelling={isCancelling}
        resultVisible={Boolean(result)}
        onRepositoryChange={(value) => {
          setRepositoryId(value);
          reset();
        }}
        onBranchChange={(value) => {
          setBranchName(value);
          reset();
        }}
        onRun={handleRun}
        onCancel={() => void cancel()}
        onReset={reset}
      />

      {isRunning ? <RepositoryAnalysisLoader phase={loaderPhase} /> : null}

      {error ? (
        <RepositoryAnalysisError error={error} />
      ) : null}

      {result ? (
        <RepositoryAnalysisResultView result={result} providerName={activeProviderName} />
      ) : !isRunning && !error ? (
        <RepositoryAnalysisEmptyState />
      ) : null}
    </motion.div>
  );
};

export default RepositoryAnalysis;
