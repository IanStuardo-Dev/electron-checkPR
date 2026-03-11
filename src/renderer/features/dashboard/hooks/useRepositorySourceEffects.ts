import React from 'react';
import type { SavedConnectionConfig } from '../types';
import { useRepositorySourceState } from './useRepositorySourceState';

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
  React.useEffect(() => {
    const hasMinimumConfig = config.provider === 'github' || config.provider === 'gitlab'
      ? Boolean(config.organization && config.personalAccessToken)
      : Boolean(config.provider && config.organization && config.project && config.personalAccessToken);

    if (!hasMinimumConfig) {
      state.resetDisconnectedState();
    }
  }, [config, state]);

  React.useEffect(() => {
    if (!state.shouldLoadRepositories) {
      return;
    }

    if (
      (config.provider && (config.provider === 'github' || config.provider === 'gitlab') && config.organization && config.personalAccessToken)
      || (config.provider !== 'github' && config.provider !== 'gitlab' && config.organization && config.project && config.personalAccessToken)
    ) {
      void refreshRepositories(configRef.current).finally(() => {
        state.setShouldLoadRepositories(false);
      });
      return;
    }

    state.setShouldLoadRepositories(false);
  }, [config, configRef, refreshRepositories, state]);
}
