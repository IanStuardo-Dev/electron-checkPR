import React from 'react';
import type { SavedConnectionConfig } from '../../types';

interface UseRepositorySourceBootstrapOptions {
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  hydrateSecret: () => Promise<string>;
  updateConfig: (name: keyof SavedConnectionConfig, value: string) => void;
  refreshPullRequests: () => Promise<void>;
}

export function useRepositorySourceBootstrap({
  configRef,
  hydrateSecret,
  updateConfig,
  refreshPullRequests,
}: UseRepositorySourceBootstrapOptions) {
  React.useEffect(() => {
    void hydrateSecret().then((personalAccessToken) => {
      if (!personalAccessToken) {
        return;
      }

      updateConfig('personalAccessToken', personalAccessToken);

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
}
