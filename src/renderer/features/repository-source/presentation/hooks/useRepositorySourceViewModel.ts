import React from 'react';
import type { SavedConnectionConfig } from '../../types';
import type { ReturnTypeUseRepositorySourceController } from './useRepositorySourceViewModel.types';
import type { ReturnTypeUseRepositorySourceDerived } from './useRepositorySourceViewModel.types';
import type { ReturnTypeUseRepositorySourceWiring } from './useRepositorySourceViewModel.types';

interface UseRepositorySourceViewModelOptions {
  wiring: ReturnTypeUseRepositorySourceWiring;
  controller: ReturnTypeUseRepositorySourceController;
  derived: ReturnTypeUseRepositorySourceDerived;
}

export function useRepositorySourceViewModel({
  wiring,
  controller,
  derived,
}: UseRepositorySourceViewModelOptions) {
  const { configHook, config, activeProvider, activeProviderName } = wiring;
  const { updateConfig, selectProjectConfig } = configHook;

  const handleConfigChange = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    controller.resetForConfigChange(name, value);
    updateConfig(name, value);
  }, [controller, updateConfig]);

  const handleProjectSelect = React.useCallback((project: string) => {
    controller.selectProject(project);
    selectProjectConfig(project);
  }, [controller, selectProjectConfig]);

  return {
    activeProvider,
    activeProviderName,
    config,
    error: controller.error,
    isLoading: controller.isLoading,
    projects: controller.projects,
    projectsLoading: controller.projectsLoading,
    projectDiscoveryWarning: controller.projectDiscoveryWarning,
    repositories: controller.repositories,
    repositoriesLoading: controller.repositoriesLoading,
    hasCredentialsInSession: derived.hasCredentialsInSession,
    hasSuccessfulConnection: controller.hasSuccessfulConnection,
    isConnectionReady: derived.isConnectionReady,
    diagnostics: controller.diagnostics,
    selectedProjectName: derived.selectedProjectName,
    selectedRepositoryName: derived.selectedRepositoryName,
    summary: derived.summary,
    isConnectionPanelOpen: controller.isConnectionPanelOpen,
    updateConfig: handleConfigChange,
    discoverProjects: controller.discoverProjects,
    selectProject: handleProjectSelect,
    refreshPullRequests: controller.refreshPullRequests,
    openPullRequest: controller.openPullRequest,
    openConnectionPanel: controller.openConnectionPanel,
  };
}
