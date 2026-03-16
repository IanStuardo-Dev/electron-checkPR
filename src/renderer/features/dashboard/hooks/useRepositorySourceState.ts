import React from 'react';
import type { RepositoryProject, RepositorySummary, ReviewItem } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';

export function useRepositorySourceState(initialProvider: SavedConnectionConfig['provider']) {
  void initialProvider;
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
  const [isConnectionPanelOpen, setIsConnectionPanelOpen] = React.useState(true);

  const resetForConfigChange = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    void value;
    setPullRequests([]);
    setLastUpdatedAt(null);
    setHasSuccessfulConnection(false);

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

  const resetDisconnectedState = React.useCallback(() => {
    setProjects([]);
    setRepositories([]);
    setHasSuccessfulConnection(false);
  }, []);

  const markProjectSelection = React.useCallback((project: string) => {
    setPullRequests([]);
    setLastUpdatedAt(null);
    setHasSuccessfulConnection(false);
    setRepositories([]);
    setShouldLoadRepositories(Boolean(project));
  }, []);

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
    shouldLoadRepositories,
    isConnectionPanelOpen,
    setPullRequests,
    setProjects,
    setRepositories,
    setError,
    setProjectDiscoveryWarning,
    setIsLoading,
    setProjectsLoading,
    setRepositoriesLoading,
    setLastUpdatedAt,
    setHasSuccessfulConnection,
    setShouldLoadRepositories,
    setIsConnectionPanelOpen,
    resetForConfigChange,
    resetDisconnectedState,
    markProjectSelection,
  };
}
