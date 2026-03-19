import React from 'react';
import type { ReviewItem } from '../../../../../types/repository';
import { createRepositorySourceApi } from '../../application/repositorySourceApiFactory';
import type { RepositorySourceFetcherPort } from '../../data/repositorySourceFetcher';
import type { SavedConnectionConfig } from '../../types';
import type { useRepositoryDiagnostics } from './useRepositoryDiagnostics';
import { useRepositorySourceEffects } from './useRepositorySourceEffects';
import type { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceApiOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  activeProviderName: string;
  scopeLabel: string;
  state: ReturnType<typeof useRepositorySourceState>;
  diagnostics: ReturnType<typeof useRepositoryDiagnostics>;
  onPersistSnapshot: (pullRequests: ReviewItem[], capturedAt: Date, scopeLabel: string, targetReviewer?: string) => void;
  fetcher: RepositorySourceFetcherPort;
}

export function useRepositorySourceApi({
  config,
  configRef,
  activeProviderName,
  scopeLabel,
  state,
  diagnostics,
  onPersistSnapshot,
  fetcher,
}: UseRepositorySourceApiOptions) {
  const api = React.useMemo(() => createRepositorySourceApi({
    configRef,
    activeProviderName,
    scopeLabel,
    state,
    diagnostics,
    snapshot: {
      persistSnapshot: onPersistSnapshot,
    },
    fetcher,
  }), [activeProviderName, configRef, diagnostics, fetcher, onPersistSnapshot, scopeLabel, state]);

  useRepositorySourceEffects({
    config,
    configRef,
    state,
    refreshRepositories: api.refreshRepositories,
  });

  return {
    refreshProjects: api.refreshProjects,
    refreshRepositories: api.refreshRepositories,
    refreshPullRequests: api.refreshPullRequests,
    discoverProjects: api.discoverProjects,
    openPullRequest: api.openPullRequest,
  };
}
