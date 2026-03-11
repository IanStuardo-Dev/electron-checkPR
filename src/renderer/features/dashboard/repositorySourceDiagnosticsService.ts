import type { useRepositoryDiagnostics } from './hooks/useRepositoryDiagnostics';
import type { SavedConnectionConfig } from './types';

type RepositorySourceDiagnostics = ReturnType<typeof useRepositoryDiagnostics>;

export function clearRepositoryDiagnostics(
  diagnostics: RepositorySourceDiagnostics,
  operation: 'projects' | 'repositories' | 'pullRequests',
  config: SavedConnectionConfig,
) {
  diagnostics.updateDiagnostics(operation, config, null);
}

export function failRepositoryDiagnostics(
  diagnostics: RepositorySourceDiagnostics,
  operation: 'projects' | 'repositories' | 'pullRequests',
  config: SavedConnectionConfig,
  message: string,
) {
  diagnostics.updateDiagnostics(operation, config, message);
}

export function getRepositorySourceErrorMessage(activeProviderName: string, error: unknown) {
  return error instanceof Error ? error.message : `Unknown ${activeProviderName} error.`;
}

