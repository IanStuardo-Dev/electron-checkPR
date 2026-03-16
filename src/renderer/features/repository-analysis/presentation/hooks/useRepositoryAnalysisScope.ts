import React from 'react';
import type { RepositoryAnalysisRequest, RepositorySnapshotPreview } from '../../../../../types/analysis';
import type { RepositoryProviderDefinition, RepositorySummary } from '../../../../../types/repository';
import {
  buildRepositoryAnalysisPayload,
} from '../../application/repositoryAnalysisPayload';
import {
  canPrepareRepositoryAnalysisPreview,
  canRunRepositoryAnalysis,
  isRepositoryAnalysisStrictModeBlocked,
} from '../../application/repositoryAnalysisGuards';
import type { SavedConnectionConfig } from '../../../repository-source';
import type { CodexIntegrationConfig } from '../../../settings';
import { useRepositoryBranches } from './useRepositoryBranches';

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
  const [snapshotAcknowledged, setSnapshotAcknowledged] = React.useState(false);
  const [pendingExcludedPaths, setPendingExcludedPaths] = React.useState<string[]>([]);

  const {
    branches,
    branchName,
    setBranchName,
    isLoadingBranches,
    branchError,
  } = useRepositoryBranches({
    config,
    isConnectionReady,
    repositoryId,
  });

  React.useEffect(() => {
    setRepositoryId(config.repositoryId || '');
  }, [config.repositoryId]);

  React.useEffect(() => {
    setSnapshotAcknowledged(false);
  }, [repositoryId, branchName, preview?.repository, preview?.branch]);

  React.useEffect(() => {
    setPendingExcludedPaths([]);
  }, [repositoryId, branchName]);

  const selectedRepository = React.useMemo(
    () => repositories.find((repository) => repository.id === repositoryId) || null,
    [repositories, repositoryId],
  );

  const canPreparePreview = canPrepareRepositoryAnalysisPreview({
    providerKind: config.provider,
    activeProvider,
    isConnectionReady,
    isCodexReady,
    repositoryId,
    branchName,
    isRunning,
    isPreviewing,
  });

  const isStrictModeBlocked = isRepositoryAnalysisStrictModeBlocked(preview, codexConfig);

  const canRunAnalysis = canRunRepositoryAnalysis({
    providerKind: config.provider,
    activeProvider,
    isConnectionReady,
    isCodexReady,
    repositoryId,
    branchName,
    preview,
    snapshotAcknowledged,
    isStrictModeBlocked,
    isRunning,
  });

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
  }, [reset, setBranchName]);

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
