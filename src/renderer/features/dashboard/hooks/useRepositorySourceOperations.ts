import React from 'react';
import type { RepositoryProject, RepositorySummary, ReviewItem } from '../../../../types/repository';
import { fetchProjects, fetchPullRequests, fetchRepositories, openReviewItem } from '../ipc';
import { buildDiagnostics } from '../repositorySourceDiagnostics';
import type { AzureDiagnostics, SavedConnectionConfig } from '../types';

interface UseRepositorySourceOperationsOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
}

export function useRepositorySourceOperations({
  config,
  configRef,
  activeProviderName,
  scopeLabel,
  onPersistSnapshot,
}: UseRepositorySourceOperationsOptions) {
  const [pullRequests, setPullRequests] = React.useState<ReviewItem[]>([]);
  const [projects, setProjects] = React.useState<RepositoryProject[]>([]);
  const [repositories, setRepositories] = React.useState<RepositorySummary[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [projectDiscoveryWarning, setProjectDiscoveryWarning] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [projectsLoading, setProjectsLoading] = React.useState(false);
  const [repositoriesLoading, setRepositoriesLoading] = React.useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);
  const [hasSuccessfulConnection, setHasSuccessfulConnection] = React.useState(false);
  const [shouldLoadRepositories, setShouldLoadRepositories] = React.useState(false);
  const [diagnostics, setDiagnostics] = React.useState<AzureDiagnostics>({
    operation: null,
    provider: config.provider,
    organization: '',
    project: '',
    repositoryId: '',
    requestPath: '',
    lastError: null,
  });
  const [isConnectionPanelOpen, setIsConnectionPanelOpen] = React.useState(true);

  const updateDiagnostics = React.useCallback((
    operation: AzureDiagnostics['operation'],
    nextConfig: SavedConnectionConfig,
    lastError: string | null = null,
  ) => {
    setDiagnostics(buildDiagnostics(operation, nextConfig, lastError));
  }, []);

  const resetForConfigChange = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    void value;
    setPullRequests([]);
    setLastUpdatedAt(null);
    setHasSuccessfulConnection(false);
    setDiagnostics((current) => ({ ...current, lastError: null }));

    if (name === 'organization') {
      setProjects([]);
      setRepositories([]);
      setShouldLoadRepositories(false);
    }

    if (name === 'provider') {
      setProjects([]);
      setRepositories([]);
      setProjectDiscoveryWarning(null);
      setShouldLoadRepositories(false);
    }

    if (name === 'project') {
      setRepositories([]);
      setShouldLoadRepositories(Boolean(value));
    }
  }, []);

  const handleConfigChanged = React.useCallback(() => {
    return;
  }, []);

  const refreshProjects = React.useCallback(async (nextConfig = configRef.current) => {
    if (!nextConfig.provider || !nextConfig.organization || !nextConfig.personalAccessToken) {
      setProjects([]);
      return [];
    }

    setProjectsLoading(true);
    updateDiagnostics('projects', nextConfig, null);

    try {
      const result = await fetchProjects(nextConfig);
      setProjects(result);
      if (nextConfig.provider === 'github' || nextConfig.provider === 'gitlab') {
        setRepositories(result.map((project) => ({
          id: project.id,
          name: project.name,
        })));
      }
      setProjectDiscoveryWarning(null);
      return result;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : `Unknown ${activeProviderName} error.`;
      setProjects([]);
      updateDiagnostics('projects', nextConfig, message);
      setProjectDiscoveryWarning(
        message.includes('(404)')
          ? 'No se pudieron listar proyectos automáticamente. Puedes escribir el proyecto manualmente y seguir trabajando.'
          : message,
      );
      return [];
    } finally {
      setProjectsLoading(false);
    }
  }, [activeProviderName, configRef, updateDiagnostics]);

  const refreshRepositories = React.useCallback(async (nextConfig = configRef.current) => {
    if (!nextConfig.provider) {
      setRepositories([]);
      return [];
    }

    const needsOnlyOrganization = nextConfig.provider === 'github' || nextConfig.provider === 'gitlab';
    const hasMinimumConfig = needsOnlyOrganization
      ? Boolean(nextConfig.organization && nextConfig.personalAccessToken)
      : Boolean(nextConfig.organization && nextConfig.project && nextConfig.personalAccessToken);

    if (!hasMinimumConfig) {
      setRepositories([]);
      return [];
    }

    setRepositoriesLoading(true);
    updateDiagnostics('repositories', nextConfig, null);

    try {
      const result = await fetchRepositories(nextConfig);
      setRepositories(result);
      return result;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : `Unknown ${activeProviderName} error.`;
      updateDiagnostics('repositories', nextConfig, message);
      setError(message);
      setHasSuccessfulConnection(false);
      return [];
    } finally {
      setRepositoriesLoading(false);
    }
  }, [activeProviderName, configRef, updateDiagnostics]);

  const refreshPullRequests = React.useCallback(async () => {
    const activeConfig = configRef.current;

    if (!activeConfig.provider) {
      setError('Selecciona un provider antes de sincronizar.');
      setHasSuccessfulConnection(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    updateDiagnostics('pullRequests', activeConfig, null);

    try {
      await refreshProjects(activeConfig);
      await refreshRepositories(activeConfig);
      const result = await fetchPullRequests(activeConfig);
      setPullRequests(result);
      const snapshotTimestamp = new Date();
      setLastUpdatedAt(snapshotTimestamp);
      setHasSuccessfulConnection(true);
      setIsConnectionPanelOpen(false);
      onPersistSnapshot(result, snapshotTimestamp, scopeLabel, activeConfig.targetReviewer);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : `Unknown ${activeProviderName} error.`;
      updateDiagnostics('pullRequests', activeConfig, message);
      setPullRequests([]);
      setLastUpdatedAt(null);
      setHasSuccessfulConnection(false);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeProviderName, configRef, onPersistSnapshot, refreshProjects, refreshRepositories, scopeLabel, updateDiagnostics]);

  const discoverProjects = React.useCallback(async () => {
    const activeConfig = configRef.current;

    if (!activeConfig.provider) {
      const message = 'Selecciona un provider antes de cargar proyectos.';
      setError(message);
      updateDiagnostics('projects', activeConfig, message);
      return;
    }

    if (!activeConfig.organization.trim() || !activeConfig.personalAccessToken.trim()) {
      const message = `El alcance principal y el token son obligatorios para cargar ${activeProviderName}.`;
      setError(message);
      updateDiagnostics('projects', activeConfig, message);
      return;
    }

    setError(null);
    await refreshProjects(activeConfig);
  }, [activeProviderName, configRef, refreshProjects, updateDiagnostics]);

  const openPullRequest = React.useCallback(async (url: string) => {
    try {
      if (!configRef.current.provider) {
        throw new Error('Selecciona un provider antes de abrir un PR.');
      }

      await openReviewItem(url, configRef.current);
    } catch (openError) {
      const message = openError instanceof Error ? openError.message : 'Unable to open pull request.';
      setError(message);
    }
  }, [configRef]);

  const openConnectionPanel = React.useCallback(() => {
    setIsConnectionPanelOpen(true);
  }, []);

  const selectProject = React.useCallback((project: string) => {
    setPullRequests([]);
    setLastUpdatedAt(null);
    setHasSuccessfulConnection(false);
    setRepositories([]);
    setShouldLoadRepositories(Boolean(project));
  }, []);

  React.useEffect(() => {
    const hasMinimumConfig = config.provider === 'github' || config.provider === 'gitlab'
      ? Boolean(config.organization && config.personalAccessToken)
      : Boolean(config.provider && config.organization && config.project && config.personalAccessToken);

    if (!hasMinimumConfig) {
      setProjects([]);
      setRepositories([]);
      setHasSuccessfulConnection(false);
    }
  }, [config]);

  React.useEffect(() => {
    if (!shouldLoadRepositories) {
      return;
    }

    if (
      (config.provider && (config.provider === 'github' || config.provider === 'gitlab') && config.organization && config.personalAccessToken)
      || (config.provider !== 'github' && config.provider !== 'gitlab' && config.organization && config.project && config.personalAccessToken)
    ) {
      void refreshRepositories(configRef.current).finally(() => {
        setShouldLoadRepositories(false);
      });
      return;
    }

    setShouldLoadRepositories(false);
  }, [config, configRef, refreshRepositories, shouldLoadRepositories]);

  return {
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
    handleConfigChanged,
    refreshPullRequests,
    refreshProjects,
    refreshRepositories,
    discoverProjects,
    selectProject,
    openPullRequest,
    openConnectionPanel,
    setConfigDiagnostics: setDiagnostics,
  };
}
