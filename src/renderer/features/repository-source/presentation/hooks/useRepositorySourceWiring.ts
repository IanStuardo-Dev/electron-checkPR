import React from 'react';
import { buildScopeLabel, getProviderDisplayName } from '../../application/repositorySourceDiagnostics';
import { repositorySourceConfigStorageAdapter } from '../../data/repositorySourceConfigStorageAdapter';
import { getRepositoryProvider } from '../../providers';
import { useRepositorySourceConfig } from './useRepositorySourceConfig';
import { useRepositorySourceSnapshotPersistence } from './useRepositorySourceSnapshotPersistence';

export function useRepositorySourceWiring() {
  const configHook = useRepositorySourceConfig({
    storage: repositorySourceConfigStorageAdapter,
  });
  const { config, configRef, hydrateSecret, migrateLegacyStorage, applyHydratedSecret } = configHook;
  const persistSnapshot = useRepositorySourceSnapshotPersistence(configRef);
  const activeProvider = React.useMemo(() => getRepositoryProvider(config.provider), [config.provider]);
  const activeProviderName = React.useMemo(() => getProviderDisplayName(activeProvider), [activeProvider]);
  const baseScopeLabel = React.useMemo(() => buildScopeLabel(config, null, null), [config]);

  return {
    configHook,
    config,
    configRef,
    persistSnapshot,
    activeProvider,
    activeProviderName,
    baseScopeLabel,
    hydrateSecret,
    migrateLegacyStorage,
    applyHydratedSecret,
  };
}
