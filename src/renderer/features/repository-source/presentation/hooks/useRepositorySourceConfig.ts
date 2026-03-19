import React from 'react';
import { getRepositorySourceProviderBehavior } from '../../application/repositorySourceProviderBehavior';
import type { RepositorySourceConfigStoragePort } from '../../application/repositorySourceConfigStoragePort';
import type { SavedConnectionConfig } from '../../types';
import type { RepositoryProviderSelection } from '../../../../../types/repository';

interface UseRepositorySourceConfigOptions {
  storage: RepositorySourceConfigStoragePort;
}

interface UseRepositorySourceConfigResult {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  updateConfig: (name: keyof SavedConnectionConfig, value: string) => void;
  selectProjectConfig: (project: string) => void;
  applyHydratedSecret: (value: string) => SavedConnectionConfig;
  hydrateSecret: () => Promise<string>;
  migrateLegacyStorage: () => Promise<void>;
}

export function useRepositorySourceConfig({
  storage,
}: UseRepositorySourceConfigOptions): UseRepositorySourceConfigResult {
  const initialConfig = React.useMemo(() => storage.loadConfig(), [storage]);
  const [config, setConfig] = React.useState<SavedConnectionConfig>(initialConfig);
  const configRef = React.useRef<SavedConnectionConfig>(initialConfig);

  React.useEffect(() => {
    configRef.current = config;
    void storage.persistConfig(config);
  }, [config, storage]);

  const updateConfig = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    setConfig((current) => {
      const nextConfig = getRepositorySourceProviderBehavior(current.provider)?.applyConfigChange(current, name, value)
        ?? (name === 'provider'
          ? getRepositorySourceProviderBehavior(value as RepositoryProviderSelection)?.applyConfigChange(current, name, value)
          : null)
        ?? {
          ...current,
          [name]: value,
        };

      configRef.current = nextConfig;
      return nextConfig;
    });
  }, []);

  const selectProjectConfig = React.useCallback((project: string) => {
    setConfig((current) => {
      const nextConfig = getRepositorySourceProviderBehavior(current.provider)?.applyProjectSelection(current, project)
        ?? {
          ...current,
          project,
          repositoryId: '',
        };

      configRef.current = nextConfig;
      return nextConfig;
    });
  }, []);

  const applyHydratedSecret = React.useCallback((value: string) => {
    const nextConfig = {
      ...configRef.current,
      personalAccessToken: value,
    };

    configRef.current = nextConfig;
    setConfig(nextConfig);
    return nextConfig;
  }, []);

  const hydrateSecret = React.useCallback(() => storage.hydrateSecret(), [storage]);
  const migrateLegacyStorage = React.useCallback(() => storage.migrateLegacyStorage(), [storage]);

  return {
    config,
    configRef,
    updateConfig,
    selectProjectConfig,
    applyHydratedSecret,
    hydrateSecret,
    migrateLegacyStorage,
  };
}
