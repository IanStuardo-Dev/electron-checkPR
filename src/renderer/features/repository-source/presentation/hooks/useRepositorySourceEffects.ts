import React from 'react';
import { hasMinimumRepositoryConfig } from '../../application/repositorySourceRules';
import type { SavedConnectionConfig } from '../../types';
import type { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceEffectsOptions {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  state: ReturnType<typeof useRepositorySourceState>;
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

  React.useEffect(() => {
    if (!hasMinimumRepositoryConfig(config)) {
      resetDisconnectedState();
    }
  }, [config.organization, config.personalAccessToken, config.project, config.provider, resetDisconnectedState]);

  React.useEffect(() => {
    if (!shouldLoadRepositories) {
      return;
    }

    if (hasMinimumRepositoryConfig(config)) {
      void refreshRepositories(configRef.current).finally(() => {
        setShouldLoadRepositories(false);
      });
      return;
    }

    setShouldLoadRepositories(false);
  }, [
    config.organization,
    config.personalAccessToken,
    config.project,
    config.provider,
    configRef,
    refreshRepositories,
    setShouldLoadRepositories,
    shouldLoadRepositories,
  ]);
}
