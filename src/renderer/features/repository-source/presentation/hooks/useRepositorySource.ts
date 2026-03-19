import React from 'react';
import { getRepositoryProvider } from '../../providers';
import { buildScopeLabel, getProviderDisplayName } from '../../application/repositorySourceDiagnostics';
import { useRepositorySourceBootstrap } from './useRepositorySourceBootstrap';
import { useRepositorySourceConfig } from './useRepositorySourceConfig';
import { useRepositorySourceDerived } from './useRepositorySourceDerived';
import { useRepositorySourceController } from './useRepositorySourceController';
import { useRepositorySourceSnapshotPersistence } from './useRepositorySourceSnapshotPersistence';

export function useRepositorySource() {
  const configHook = useRepositorySourceConfig();
  const { config, configRef, updateConfig, selectProjectConfig, hydrateSecret } = configHook;
  const { applyHydratedSecret } = configHook;
  const persistSnapshot = useRepositorySourceSnapshotPersistence(configRef);
  const activeProvider = React.useMemo(() => getRepositoryProvider(config.provider), [config.provider]);
  const activeProviderName = React.useMemo(() => getProviderDisplayName(activeProvider), [activeProvider]);
  const baseScopeLabel = React.useMemo(() => buildScopeLabel(config, null, null), [config]);

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
  } = useRepositorySourceController({
    config,
    configRef,
    activeProviderName,
    scopeLabel: baseScopeLabel,
    onPersistSnapshot: persistSnapshot,
  });

  const derived = useRepositorySourceDerived({
    config,
    projects,
    repositories,
    pullRequests,
    lastUpdatedAt,
    hasSuccessfulConnection,
  });

  useRepositorySourceBootstrap({
    applyHydratedSecret,
    hydrateSecret,
    refreshPullRequests,
  });

  const handleConfigChange = React.useCallback((name: keyof typeof config, value: string) => {
    resetForConfigChange(name, value);
    updateConfig(name, value);
  }, [resetForConfigChange, updateConfig]);

  const handleProjectSelect = React.useCallback((project: string) => {
    selectProject(project);
    selectProjectConfig(project);
  }, [selectProject, selectProjectConfig]);

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
    hasCredentialsInSession: derived.hasCredentialsInSession,
    hasSuccessfulConnection,
    isConnectionReady: derived.isConnectionReady,
    diagnostics,
    selectedProjectName: derived.selectedProjectName,
    selectedRepositoryName: derived.selectedRepositoryName,
    summary: derived.summary,
    isConnectionPanelOpen,
    updateConfig: handleConfigChange,
    discoverProjects,
    selectProject: handleProjectSelect,
    refreshPullRequests,
    openPullRequest,
    openConnectionPanel,
  };
}
