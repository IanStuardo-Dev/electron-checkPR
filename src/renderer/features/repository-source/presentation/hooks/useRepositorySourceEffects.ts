import React from 'react';
import { hasMinimumRepositoryConfig } from '../../application/repositorySourceRules';
import type { SavedConnectionConfig } from '../../types';
import type { RepositorySourceEffectsStatePort } from './repositorySourceHookContracts';

interface UseRepositorySourceEffectsOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  state: RepositorySourceEffectsStatePort;
  refreshRepositories: (nextConfig?: SavedConnectionConfig) => Promise<unknown[]>;
}

export function useRepositorySourceEffects({
  config,
  configRef,
  state,
  refreshRepositories,
}: UseRepositorySourceEffectsOptions) {
  const {
    shouldLoadRepositories,
    resetDisconnectedState,
    setShouldLoadRepositories,
  } = state;
  const repositoryReadinessConfig = React.useMemo(
    () => ({
      provider: config.provider,
      organization: config.organization,
      project: config.project,
      repositoryId: config.repositoryId,
      personalAccessToken: config.personalAccessToken,
      targetReviewer: config.targetReviewer,
    }),
    [
      config.organization,
      config.personalAccessToken,
      config.project,
      config.provider,
      config.repositoryId,
      config.targetReviewer,
    ],
  );
  const hasMinimumConfig = React.useMemo(
    () => hasMinimumRepositoryConfig(repositoryReadinessConfig),
    [repositoryReadinessConfig],
  );

  React.useEffect(() => {
    if (!hasMinimumConfig) {
      resetDisconnectedState();
    }
  }, [hasMinimumConfig, resetDisconnectedState]);

  React.useEffect(() => {
    if (!shouldLoadRepositories) {
      return;
    }

    if (hasMinimumConfig) {
      void refreshRepositories(configRef.current).finally(() => {
        setShouldLoadRepositories(false);
      });
      return;
    }

    setShouldLoadRepositories(false);
  }, [
    configRef,
    hasMinimumConfig,
    refreshRepositories,
    setShouldLoadRepositories,
    shouldLoadRepositories,
  ]);
}
