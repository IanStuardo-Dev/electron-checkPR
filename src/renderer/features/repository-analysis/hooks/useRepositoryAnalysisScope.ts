import React from 'react';
import type { RepositoryAnalysisRequest, RepositorySnapshotPreview } from '../../../../types/analysis';
import type { RepositoryBranch, RepositoryProviderDefinition, RepositorySummary } from '../../../../types/repository';
import { mergeExcludedPathPatterns } from '../../../../services/shared/repository-snapshot-helpers';
import { fetchBranches } from '../../dashboard/ipc';
import type { CodexIntegrationConfig, SavedConnectionConfig } from '../../dashboard/types';

interface UseRepositoryAnalysisScopeOptions {
  activeProvider: RepositoryProviderDefinition | null;
  config: SavedConnectionConfig;
  repositories: RepositorySummary[];
  isConnectionReady: boolean;
  isCodexReady: boolean;
  codexConfig: CodexIntegrationConfig;
  preview: RepositorySnapshotPreview | null;
  isRunning: boolean;
  isPreviewing: boolean;
  preparePreview: (payload: RepositoryAnalysisRequest) => void | Promise<void>;
  execute: (payload: RepositoryAnalysisRequest) => void | Promise<void>;
  reset: () => void;
}

function buildRepositoryAnalysisPayload({
  activeProvider,
  config,
  repositoryId,
  branchName,
  codexConfig,
  pendingExcludedPaths,
}: {
  activeProvider: RepositoryProviderDefinition;
  config: SavedConnectionConfig;
  repositoryId: string;
  branchName: string;
  codexConfig: CodexIntegrationConfig;
  pendingExcludedPaths: string[];
}): RepositoryAnalysisRequest {
  return {
    requestId: `${Date.now()}-${repositoryId}-${branchName}`,
    source: {
      ...config,
      provider: activeProvider.kind,
      repositoryId,
      project: activeProvider.kind === 'azure-devops' ? config.project : repositoryId,
    },
    repositoryId,
    branchName,
    model: codexConfig.model,
    apiKey: '',
    analysisDepth: codexConfig.analysisDepth,
    maxFilesPerRun: codexConfig.maxFilesPerRun,
    includeTests: codexConfig.includeTests,
    snapshotPolicy: {
      ...codexConfig.snapshotPolicy,
      excludedPathPatterns: mergeExcludedPathPatterns(
        codexConfig.snapshotPolicy.excludedPathPatterns,
        pendingExcludedPaths.join('\n'),
      ),
    },
    timeoutMs: 90_000,
    promptDirectives: codexConfig.promptDirectives,
  };
}

export function useRepositoryAnalysisScope({
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
}: UseRepositoryAnalysisScopeOptions) {
  const [repositoryId, setRepositoryId] = React.useState(config.repositoryId || '');
  const [branchName, setBranchName] = React.useState('');
  const [branches, setBranches] = React.useState<RepositoryBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(false);
  const [branchError, setBranchError] = React.useState<string | null>(null);
  const [snapshotAcknowledged, setSnapshotAcknowledged] = React.useState(false);
  const [pendingExcludedPaths, setPendingExcludedPaths] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRepositoryId(config.repositoryId || '');
  }, [config.repositoryId]);

  React.useEffect(() => {
    setSnapshotAcknowledged(false);
  }, [repositoryId, branchName, preview?.repository, preview?.branch]);

  React.useEffect(() => {
    setPendingExcludedPaths([]);
  }, [repositoryId, branchName]);

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

  const selectedRepository = React.useMemo(
    () => repositories.find((repository) => repository.id === repositoryId) || null,
    [repositories, repositoryId],
  );

  const canPreparePreview = Boolean(
    config.provider
    && activeProvider
    && isConnectionReady
    && isCodexReady
    && repositoryId
    && branchName
    && !isRunning
    && !isPreviewing,
  );

  const isStrictModeBlocked = Boolean(
    preview
    && codexConfig.snapshotPolicy.strictMode
    && (preview.sensitivity.hasSecretPatterns || preview.sensitivity.hasSensitiveConfigFiles),
  );

  const canRunAnalysis = Boolean(
    config.provider
    && activeProvider
    && isConnectionReady
    && isCodexReady
    && repositoryId
    && branchName
    && preview
    && preview.provider === activeProvider.kind
    && preview.branch === branchName
    && snapshotAcknowledged
    && !isStrictModeBlocked
    && !isRunning,
  );

  const buildPayload = React.useCallback(() => {
    if (!activeProvider) {
      throw new Error('No se puede construir el payload sin un provider activo.');
    }

    return buildRepositoryAnalysisPayload({
      activeProvider,
      config,
      repositoryId,
      branchName,
      codexConfig,
      pendingExcludedPaths,
    });
  }, [activeProvider, branchName, codexConfig, config, pendingExcludedPaths, repositoryId]);

  const handlePreparePreview = React.useCallback(() => {
    if (!canPreparePreview) {
      return;
    }

    setSnapshotAcknowledged(false);
    void preparePreview(buildPayload());
  }, [buildPayload, canPreparePreview, preparePreview]);

  const handleToggleExcludedPath = React.useCallback((path: string, checked: boolean) => {
    setPendingExcludedPaths((current) => (
      checked
        ? Array.from(new Set([...current, path]))
        : current.filter((item) => item !== path)
    ));
    setSnapshotAcknowledged(false);
  }, []);

  const handleRegenerateWithExclusions = React.useCallback(() => {
    if (!canPreparePreview || pendingExcludedPaths.length === 0) {
      return;
    }

    setSnapshotAcknowledged(false);
    void preparePreview(buildPayload());
  }, [buildPayload, canPreparePreview, pendingExcludedPaths.length, preparePreview]);

  const handleRun = React.useCallback(() => {
    if (!canRunAnalysis) {
      return;
    }

    void execute(buildPayload());
  }, [buildPayload, canRunAnalysis, execute]);

  const handleRepositoryChange = React.useCallback((value: string) => {
    setRepositoryId(value);
    reset();
    setSnapshotAcknowledged(false);
    setPendingExcludedPaths([]);
  }, [reset]);

  const handleBranchChange = React.useCallback((value: string) => {
    setBranchName(value);
    reset();
    setSnapshotAcknowledged(false);
    setPendingExcludedPaths([]);
  }, [reset]);

  return {
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
  };
}
