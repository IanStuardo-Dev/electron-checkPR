import React from 'react';
import type { RepositoryProject, RepositorySummary, ReviewItem } from '../../../../types/repository';
import { getRepositoryProvider } from '../../repository-source/providers';
import { fetchProjects, fetchPullRequests, fetchRepositories, openReviewItem } from '../ipc';
import { persistDashboardSnapshot } from '../history';
import { buildDashboardSummary } from '../metrics';
import {
  hydrateConnectionSecret,
  loadConnectionConfig,
  persistConnectionConfig,
  persistSavedAzureContext,
} from '../storage';
import type { AzureDiagnostics, SavedConnectionConfig } from '../types';

export function useRepositorySource() {
  const initialConfig = React.useMemo(() => loadConnectionConfig(), []);
  const [config, setConfig] = React.useState<SavedConnectionConfig>(initialConfig);
  const configRef = React.useRef<SavedConnectionConfig>(initialConfig);
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
    provider: initialConfig.provider,
    organization: '',
    project: '',
    repositoryId: '',
    requestPath: '',
    lastError: null,
  });
  const [isConnectionPanelOpen, setIsConnectionPanelOpen] = React.useState(
    () => true,
  );

  const hasCredentialsInSession = Boolean(
    config.provider && config.organization && config.personalAccessToken,
  );
  const isConnectionReady = hasCredentialsInSession && hasSuccessfulConnection;
  const activeProvider = React.useMemo(() => getRepositoryProvider(config.provider), [config.provider]);
  const activeProviderName = activeProvider?.name || 'Sin provider seleccionado';

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

  const scopeLabel = React.useMemo(() => {
    const organization = config.organization || 'No organization';
    const project = config.provider === 'github' || config.provider === 'gitlab'
      ? (selectedRepositoryName || config.project || 'Todos los repositorios')
      : (selectedProjectName || config.project || 'Sin proyecto');
    const repository = selectedRepositoryName || 'Todos los repositorios';

    return !config.provider
      ? 'Selecciona un provider en Settings'
      : config.provider === 'github' || config.provider === 'gitlab'
      ? `${organization} / ${project}`
      : `${organization} / ${project} / ${repository}`;
  }, [config.organization, config.project, config.provider, selectedProjectName, selectedRepositoryName]);

  const summary = React.useMemo(
    () => buildDashboardSummary(pullRequests, lastUpdatedAt, scopeLabel, config.targetReviewer),
    [config.targetReviewer, lastUpdatedAt, pullRequests, scopeLabel],
  );

  const updateDiagnostics = React.useCallback((
    operation: AzureDiagnostics['operation'],
    nextConfig: SavedConnectionConfig,
    lastError: string | null = null,
  ) => {
    const organization = nextConfig.organization.trim();
    const project = nextConfig.project.trim();
    const repositoryId = nextConfig.repositoryId?.trim() || '';
    const requestPath = nextConfig.provider === 'github'
      ? operation === 'projects' || operation === 'repositories'
        ? 'https://api.github.com/user/repos'
        : operation === 'pullRequests'
          ? (repositoryId || project
            ? `https://api.github.com/repos/${organization}/${repositoryId || project}/pulls`
            : 'https://api.github.com/user/repos -> /repos/{owner}/{repo}/pulls')
          : ''
      : nextConfig.provider === 'gitlab'
        ? operation === 'projects' || operation === 'repositories'
          ? 'https://gitlab.com/api/v4/projects'
          : operation === 'pullRequests'
            ? (repositoryId || project
              ? `https://gitlab.com/api/v4/projects/${encodeURIComponent(repositoryId || project)}/merge_requests`
              : 'https://gitlab.com/api/v4/projects -> /projects/{id}/merge_requests')
            : ''
      : operation === 'projects'
        ? `https://dev.azure.com/${organization}/_apis/projects`
        : operation === 'repositories'
          ? `https://dev.azure.com/${organization}/${project}/_apis/git/repositories`
          : operation === 'pullRequests'
            ? `https://dev.azure.com/${organization}/${project}/_apis/git/pullrequests`
            : '';

    setDiagnostics({
      operation,
      provider: nextConfig.provider,
      organization,
      project,
      repositoryId,
      requestPath,
      lastError,
    });
  }, []);

  const refreshProjects = React.useCallback(async (nextConfig = configRef.current) => {
    if (!nextConfig.organization || !nextConfig.personalAccessToken) {
      setProjects([]);
      return [];
    }

    if (!nextConfig.provider) {
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
  }, [activeProviderName, updateDiagnostics]);

  const refreshRepositories = React.useCallback(async (nextConfig = configRef.current) => {
    if (!nextConfig.provider) {
      setRepositories([]);
      return [];
    }

    if (nextConfig.provider === 'github' || nextConfig.provider === 'gitlab') {
      if (!nextConfig.organization || !nextConfig.personalAccessToken) {
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
    }

    if (!nextConfig.organization || !nextConfig.project || !nextConfig.personalAccessToken) {
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
  }, [activeProviderName, updateDiagnostics]);

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
      persistSavedAzureContext(activeConfig);
      const snapshotSummary = buildDashboardSummary(result, snapshotTimestamp, scopeLabel, activeConfig.targetReviewer);
      persistDashboardSnapshot({
        id: `${snapshotTimestamp.toISOString()}-${scopeLabel}`,
        capturedAt: snapshotTimestamp.toISOString(),
        scopeLabel,
        activePRs: snapshotSummary.activePRs,
        highRiskPRs: snapshotSummary.highRiskPRs,
        blockedPRs: snapshotSummary.blockedPRs,
        reviewBacklog: snapshotSummary.reviewBacklog,
        averageAgeHours: snapshotSummary.averageAgeHours,
        stalePRs: snapshotSummary.stalePRs,
        repositoryCount: snapshotSummary.repositoryCount,
        hotfixPRs: snapshotSummary.hotfixPRs,
      });
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
  }, [activeProviderName, refreshProjects, refreshRepositories, scopeLabel, updateDiagnostics]);

  React.useEffect(() => {
    void hydrateConnectionSecret().then((personalAccessToken) => {
      if (!personalAccessToken) {
        return;
      }

      setConfig((current) => {
        const nextConfig = {
          ...current,
          personalAccessToken,
        };
        configRef.current = nextConfig;
        return nextConfig;
      });

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

  React.useEffect(() => {
    const hasMinimumConfig = config.provider === 'github' || config.provider === 'gitlab'
      ? Boolean(config.organization && config.personalAccessToken)
      : Boolean(config.provider && config.organization && config.project && config.personalAccessToken);

    if (!hasMinimumConfig) {
      setProjects([]);
      setRepositories([]);
      setHasSuccessfulConnection(false);
    }
  }, []);

  React.useEffect(() => {
    configRef.current = config;
    void persistConnectionConfig(config);
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
  }, [config, refreshRepositories, shouldLoadRepositories]);

  const updateConfig = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
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

    setConfig((current) => {
      const nextConfig = {
        ...current,
        ...(name === 'provider'
          ? {
            organization: '',
            project: '',
            repositoryId: '',
            personalAccessToken: '',
            targetReviewer: '',
          }
          : {}),
        ...(name === 'organization'
          ? { project: '', repositoryId: '' }
          : {}),
        ...(name === 'project'
          ? { repositoryId: '' }
          : {}),
        [name]: value,
      };

      configRef.current = nextConfig;
      return nextConfig;
    });
  }, []);

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
  }, []);

  const openConnectionPanel = React.useCallback(() => {
    setIsConnectionPanelOpen(true);
  }, []);

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
  }, [activeProviderName, refreshProjects, updateDiagnostics]);

  const selectProject = React.useCallback((project: string) => {
    setPullRequests([]);
    setLastUpdatedAt(null);
    setHasSuccessfulConnection(false);
    setRepositories([]);
    setShouldLoadRepositories(Boolean(project));
    setConfig((current) => {
      const nextConfig = current.provider === 'github'
        || current.provider === 'gitlab'
        ? {
          ...current,
          project,
          repositoryId: project,
        }
        : {
          ...current,
          project,
          repositoryId: '',
        };
      configRef.current = nextConfig;
      return nextConfig;
    });
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
    selectProject,
    refreshPullRequests,
    openPullRequest,
    openConnectionPanel,
  };
}

export const useAzurePullRequests = useRepositorySource;
