import React from 'react';
import type { ReviewItem } from '../../../../types/repository';
import { getRepositoryProvider } from '../../repository-source/providers';
import { persistDashboardSnapshot } from '../history';
import { buildDashboardSummary } from '../metrics';
import { buildScopeLabel, getProviderDisplayName } from '../repositorySourceDiagnostics';
import { persistSavedAzureContext } from '../storage';
import type { SavedConnectionConfig } from '../types';
import { useRepositorySourceConfig } from './useRepositorySourceConfig';
import { useRepositorySourceOperations } from './useRepositorySourceOperations';

interface RepositorySourceConfigHandlers {
  onConfigChangeStart: (name: keyof SavedConnectionConfig, value: string) => void;
  onConfigChanged: (nextConfig: SavedConnectionConfig, name: keyof SavedConnectionConfig, value: string) => void;
  onProjectSelected: (project: string) => void;
}

export function useRepositorySource() {
  const configHandlersRef = React.useRef<RepositorySourceConfigHandlers | null>(null);
  const configHook = useRepositorySourceConfig({
    onConfigChangeStart: (name, value) => configHandlersRef.current?.onConfigChangeStart(name, value),
    onConfigChanged: (nextConfig, name, value) => configHandlersRef.current?.onConfigChanged(nextConfig, name, value),
    onProjectSelected: (project) => configHandlersRef.current?.onProjectSelected(project),
  });
  const { config, configRef, updateConfig, selectProjectConfig, hydrateSecret } = configHook;
  const activeProvider = React.useMemo(() => getRepositoryProvider(config.provider), [config.provider]);
  const activeProviderName = getProviderDisplayName(activeProvider);
  const baseScopeLabel = React.useMemo(
    () => buildScopeLabel(config, null, null),
    [config],
  );

  const persistSnapshot = React.useCallback((result: ReviewItem[], snapshotTimestamp: Date, _snapshotScopeLabel: string, targetReviewer?: string) => {
    const effectiveScopeLabel = buildScopeLabel(configRef.current, null, null);
    persistSavedAzureContext(configRef.current);
    const snapshotSummary = buildDashboardSummary(result, snapshotTimestamp, effectiveScopeLabel, targetReviewer);
    persistDashboardSnapshot({
      id: `${snapshotTimestamp.toISOString()}-${effectiveScopeLabel}`,
      capturedAt: snapshotTimestamp.toISOString(),
      scopeLabel: effectiveScopeLabel,
      activePRs: snapshotSummary.activePRs,
      highRiskPRs: snapshotSummary.highRiskPRs,
      blockedPRs: snapshotSummary.blockedPRs,
      reviewBacklog: snapshotSummary.reviewBacklog,
      averageAgeHours: snapshotSummary.averageAgeHours,
      stalePRs: snapshotSummary.stalePRs,
      repositoryCount: snapshotSummary.repositoryCount,
      hotfixPRs: snapshotSummary.hotfixPRs,
    });
  }, [configRef]);

  const {
    pullRequests,
    projects,
    repositories,
    error,
    projectDiscoveryWarning,
    isLoading,
    projectsLoading,
    repositoriesLoading,
    lastUpdatedAt,
    hasSuccessfulConnection,
    diagnostics,
    isConnectionPanelOpen,
    resetForConfigChange,
    refreshPullRequests,
    discoverProjects,
    selectProject,
    openPullRequest,
    openConnectionPanel,
  } = useRepositorySourceOperations({
    config,
    configRef,
    activeProviderName,
    scopeLabel: baseScopeLabel,
    onPersistSnapshot: persistSnapshot,
  });

  const hasCredentialsInSession = Boolean(
    config.provider && config.organization && config.personalAccessToken,
  );
  const isConnectionReady = hasCredentialsInSession && hasSuccessfulConnection;

  const selectedProjectName = React.useMemo(() => {
    if (!config.project) {
      return null;
    }

    return projects.find((project) => project.id === config.project || project.name === config.project)?.name || config.project;
  }, [config.project, projects]);

  const selectedRepositoryName = React.useMemo(() => {
    if (!config.repositoryId) {
      return null;
    }

    return repositories.find((repository) => repository.id === config.repositoryId || repository.name === config.repositoryId)?.name || config.repositoryId;
  }, [config.repositoryId, repositories]);

  const scopeLabel = React.useMemo(
    () => buildScopeLabel(config, selectedProjectName, selectedRepositoryName),
    [config, selectedProjectName, selectedRepositoryName],
  );

  configHandlersRef.current = {
    onConfigChangeStart: resetForConfigChange,
    onConfigChanged: () => undefined,
    onProjectSelected: selectProject,
  };

  const summary = React.useMemo(
    () => buildDashboardSummary(pullRequests, lastUpdatedAt, scopeLabel, config.targetReviewer),
    [config.targetReviewer, lastUpdatedAt, pullRequests, scopeLabel],
  );

  React.useEffect(() => {
    void hydrateSecret().then((personalAccessToken) => {
      if (!personalAccessToken) {
        return;
      }

      updateConfig('personalAccessToken', personalAccessToken);

      const nextConfig = {
        ...configRef.current,
        personalAccessToken,
      };
      configRef.current = nextConfig;

      const hasMinimumConfig = nextConfig.provider === 'github' || nextConfig.provider === 'gitlab'
        ? Boolean(nextConfig.organization && nextConfig.personalAccessToken)
        : Boolean(nextConfig.provider && nextConfig.organization && nextConfig.project && nextConfig.personalAccessToken);

      if (hasMinimumConfig) {
        void refreshPullRequests();
      }
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    activeProvider,
    activeProviderName,
    config,
    error,
    isLoading,
    projects,
    projectsLoading,
    projectDiscoveryWarning,
    repositories,
    repositoriesLoading,
    hasCredentialsInSession,
    hasSuccessfulConnection,
    isConnectionReady,
    diagnostics,
    selectedProjectName,
    selectedRepositoryName,
    summary,
    isConnectionPanelOpen,
    updateConfig,
    discoverProjects,
    selectProject: selectProjectConfig,
    refreshPullRequests,
    openPullRequest,
    openConnectionPanel,
  };
}

export const useAzurePullRequests = useRepositorySource;
