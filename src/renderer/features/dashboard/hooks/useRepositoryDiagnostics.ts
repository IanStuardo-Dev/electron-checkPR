import React from 'react';
import { buildDiagnostics } from '../repositorySourceDiagnostics';
import type { AzureDiagnostics, SavedConnectionConfig } from '../types';

export function useRepositoryDiagnostics(initialConfig: SavedConnectionConfig) {
  const [diagnostics, setDiagnostics] = React.useState<AzureDiagnostics>({
    operation: null,
    provider: initialConfig.provider,
    organization: '',
    project: '',
    repositoryId: '',
    requestPath: '',
    lastError: null,
  });

  const updateDiagnostics = React.useCallback((
    operation: AzureDiagnostics['operation'],
    nextConfig: SavedConnectionConfig,
    lastError: string | null = null,
  ) => {
    setDiagnostics(buildDiagnostics(operation, nextConfig, lastError));
  }, []);

  const resetDiagnosticsError = React.useCallback(() => {
    setDiagnostics((current) => ({ ...current, lastError: null }));
  }, []);

  return {
    diagnostics,
    updateDiagnostics,
    resetDiagnosticsError,
  };
}
