import React from 'react';
import { useRepositorySourceBootstrap } from './useRepositorySourceBootstrap';
import { useRepositorySourceConfig } from './useRepositorySourceConfig';
import { useRepositorySourceDerived } from './useRepositorySourceDerived';
import { useRepositorySourceFacade } from './useRepositorySourceFacade';
import { useRepositorySourceOperations } from './useRepositorySourceOperations';
import { useRepositorySourceMetadata } from '../useRepositorySourceMetadata';
import { useRepositorySourceSnapshotPersistence } from '../useRepositorySourceSnapshotPersistence';

export function useRepositorySource() {
  const facadeRef = React.useRef<ReturnType<typeof useRepositorySourceFacade> | null>(null);
  const configHook = useRepositorySourceConfig({
    onConfigChangeStart: (name, value) => facadeRef.current?.current?.onConfigChangeStart(name, value),
    onProjectSelected: (project) => facadeRef.current?.current?.onProjectSelected(project),
  });
  const { config, configRef, updateConfig, selectProjectConfig, hydrateSecret } = configHook;
  const { activeProviderName, baseScopeLabel } = useRepositorySourceMetadata(config);
  const persistSnapshot = useRepositorySourceSnapshotPersistence(configRef);

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

  facadeRef.current = useRepositorySourceFacade({
    resetForConfigChange,
    selectProject,
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
    configRef,
    hydrateSecret,
    updateConfig,
    refreshPullRequests,
  });

  return {
    activeProvider: derived.activeProvider,
    activeProviderName: derived.activeProviderName,
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
    updateConfig,
    discoverProjects,
    selectProject: selectProjectConfig,
    refreshPullRequests,
    openPullRequest,
    openConnectionPanel,
  };
}

export const useAzurePullRequests = useRepositorySource;
