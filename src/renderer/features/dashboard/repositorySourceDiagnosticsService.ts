import type { RepositorySourceDiagnosticsPort } from './repositorySourceApiPorts';
import type { SavedConnectionConfig } from './types';

export function clearRepositoryDiagnostics(
  diagnostics: RepositorySourceDiagnosticsPort,
  operation: 'projects' | 'repositories' | 'pullRequests',
  config: SavedConnectionConfig,
) {
  diagnostics.updateDiagnostics(operation, config, null);
}

export function failRepositoryDiagnostics(
  diagnostics: RepositorySourceDiagnosticsPort,
  operation: 'projects' | 'repositories' | 'pullRequests',
  config: SavedConnectionConfig,
  message: string,
) {
  diagnostics.updateDiagnostics(operation, config, message);
}

export function getRepositorySourceErrorMessage(activeProviderName: string, error: unknown) {
  return error instanceof Error ? error.message : `Unknown ${activeProviderName} error.`;
}
