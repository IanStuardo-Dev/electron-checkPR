import React from 'react';
import { getRepositoryProvider } from '../../providers';
import { buildScopeLabel, getProviderDisplayName } from '../../application/repositorySourceDiagnostics';
import type { SavedConnectionConfig } from '../../types';

export function useRepositorySourceMetadata(config: SavedConnectionConfig) {
  const activeProvider = React.useMemo(() => getRepositoryProvider(config.provider), [config.provider]);
  const activeProviderName = React.useMemo(
    () => getProviderDisplayName(activeProvider),
    [activeProvider],
  );
  const baseScopeLabel = React.useMemo(() => buildScopeLabel(config, null, null), [config]);

  return {
    activeProvider,
    activeProviderName,
    baseScopeLabel,
  };
}
