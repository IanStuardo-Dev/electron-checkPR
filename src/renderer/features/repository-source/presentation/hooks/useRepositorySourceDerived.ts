import React from 'react';
import type { RepositoryProject, RepositorySummary, ReviewItem } from '../../../../../types/repository';
import { buildDashboardSummary } from '../../../../shared/dashboard/summary';
import { buildScopeLabel } from '../../application/repositorySourceDiagnostics';
import type { SavedConnectionConfig } from '../../types';

interface UseRepositorySourceDerivedOptions {
  config: SavedConnectionConfig;
  projects: RepositoryProject[];
  repositories: RepositorySummary[];
  pullRequests: ReviewItem[];
  lastUpdatedAt: Date | null;
  hasSuccessfulConnection: boolean;
}

export function useRepositorySourceDerived({
  config,
  projects,
  repositories,
  pullRequests,
  lastUpdatedAt,
  hasSuccessfulConnection,
}: UseRepositorySourceDerivedOptions) {
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

  const summary = React.useMemo(
    () => buildDashboardSummary(pullRequests, lastUpdatedAt, scopeLabel, config.targetReviewer),
    [config.targetReviewer, lastUpdatedAt, pullRequests, scopeLabel],
  );

  return {
    hasCredentialsInSession,
    isConnectionReady,
    selectedProjectName,
    selectedRepositoryName,
    scopeLabel,
    summary,
  };
}
