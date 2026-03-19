import React from 'react';
import { buildDiagnostics } from '../../application/repositorySourceDiagnostics';
import type { RepositorySourceDiagnostics, SavedConnectionConfig } from '../../types';
import type { RepositorySourceDiagnosticsController } from './repositorySourceHookContracts';

export function useRepositoryDiagnostics(initialConfig: SavedConnectionConfig): RepositorySourceDiagnosticsController {
  const [diagnostics, setDiagnostics] = React.useState<RepositorySourceDiagnostics>(
    () => buildDiagnostics(null, initialConfig),
  );

  const updateDiagnostics = React.useCallback((
    operation: RepositorySourceDiagnostics['operation'],
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
