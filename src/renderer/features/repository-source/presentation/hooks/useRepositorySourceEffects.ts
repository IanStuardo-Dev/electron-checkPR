import React from 'react';
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
    const hasMinimumConfig = config.provider === 'github' || config.provider === 'gitlab'
      ? Boolean(config.organization && config.personalAccessToken)
      : Boolean(config.provider && config.organization && config.project && config.personalAccessToken);

    if (!hasMinimumConfig) {
      resetDisconnectedState();
    }
  }, [config.organization, config.personalAccessToken, config.project, config.provider, resetDisconnectedState]);

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
