import type { RepositoryProviderDefinition } from '../../../../types/repository';
import type { RepositorySourceDiagnostics, SavedConnectionConfig } from '../types';
import { getRepositorySourceProviderBehavior } from './repositorySourceProviderBehavior';

export function buildScopeLabel(
  config: SavedConnectionConfig,
  selectedProjectName: string | null,
  selectedRepositoryName: string | null,
): string {
  if (!config.provider) {
    return 'Selecciona un provider en Settings';
  }

  return getRepositorySourceProviderBehavior(config.provider)?.buildScopeLabel(
    config,
    selectedProjectName,
    selectedRepositoryName,
  ) || 'Selecciona un provider en Settings';
}

export function buildDiagnostics(
  operation: RepositorySourceDiagnostics['operation'],
  nextConfig: SavedConnectionConfig,
  lastError: string | null = null,
): RepositorySourceDiagnostics {
  const organization = nextConfig.organization.trim();
  const project = nextConfig.project.trim();
  const repositoryId = nextConfig.repositoryId?.trim() || '';
  const requestPath = getRepositorySourceProviderBehavior(nextConfig.provider)?.buildRequestPath(operation, nextConfig) || '';

  return {
    operation,
    provider: nextConfig.provider,
    organization,
    project,
    repositoryId,
    requestPath,
    lastError,
  };
}

export function getProviderDisplayName(provider: RepositoryProviderDefinition | null): string {
  return provider?.name || 'Sin provider seleccionado';
}
