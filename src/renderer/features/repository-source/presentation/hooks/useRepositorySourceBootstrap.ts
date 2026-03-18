import React from 'react';
import { hasMinimumPullRequestSyncConfig } from '../../application/repositorySourceRules';
import type { SavedConnectionConfig } from '../../types';

interface UseRepositorySourceBootstrapOptions {
  hydrateSecret: () => Promise<string>;
  applyHydratedSecret: (value: string) => SavedConnectionConfig;
  refreshPullRequests: () => Promise<void>;
}

export function useRepositorySourceBootstrap({
  hydrateSecret,
  applyHydratedSecret,
  refreshPullRequests,
}: UseRepositorySourceBootstrapOptions) {
  React.useEffect(() => {
    let isMounted = true;

    void hydrateSecret()
      .then((personalAccessToken) => {
        if (!personalAccessToken || !isMounted) {
          return;
        }

        const nextConfig = applyHydratedSecret(personalAccessToken);
        if (hasMinimumPullRequestSyncConfig(nextConfig)) {
          void refreshPullRequests();
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [applyHydratedSecret, hydrateSecret, refreshPullRequests]);
}
