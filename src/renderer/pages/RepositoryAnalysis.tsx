import React from 'react';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import { useRepositorySourceContext } from '../features/dashboard/context/RepositorySourceContext';
import { useRepositoryAnalysis } from '../features/repository-analysis/hooks/useRepositoryAnalysis';
import { useRepositoryAnalysisScope } from '../features/repository-analysis/hooks/useRepositoryAnalysisScope';
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
  const { phase, preview, result, error, isPreviewing, isRunning, isCancelling, preparePreview, execute, cancel, reset } = useRepositoryAnalysis();
  const {
    repositoryId,
    branchName,
    branches,
    isLoadingBranches,
    branchError,
    selectedRepository,
    snapshotAcknowledged,
    setSnapshotAcknowledged,
    pendingExcludedPaths,
    canPreparePreview,
    isStrictModeBlocked,
    canRunAnalysis,
    handleRepositoryChange,
    handleBranchChange,
    handlePreparePreview,
    handleToggleExcludedPath,
    handleRegenerateWithExclusions,
    handleRun,
  } = useRepositoryAnalysisScope({
    activeProvider,
    config,
    repositories,
    isConnectionReady,
    isCodexReady,
    codexConfig,
    preview,
    isRunning,
    isPreviewing,
    preparePreview,
    execute,
    reset,
  });

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
    <div className="space-y-6">
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
        canPreparePreview={canPreparePreview}
        canRunAnalysis={canRunAnalysis}
        preview={preview}
        strictModeEnabled={codexConfig.snapshotPolicy.strictMode}
        strictModeBlocked={isStrictModeBlocked}
        pendingExcludedPaths={pendingExcludedPaths}
        snapshotAcknowledged={snapshotAcknowledged}
        onToggleExcludedPath={handleToggleExcludedPath}
        onRegenerateWithExclusions={handleRegenerateWithExclusions}
        onToggleAcknowledgement={setSnapshotAcknowledged}
        isPreviewing={isPreviewing}
        isCancelling={isCancelling}
        resultVisible={Boolean(result)}
        onRepositoryChange={handleRepositoryChange}
        onBranchChange={handleBranchChange}
        onPreparePreview={handlePreparePreview}
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
    </div>
  );
};

export default RepositoryAnalysis;
