import type { RepositoryProviderDefinition } from '../../../types/repository';
import type { AzureDiagnostics, SavedConnectionConfig } from './types';

export function buildScopeLabel(
  config: SavedConnectionConfig,
  selectedProjectName: string | null,
  selectedRepositoryName: string | null,
): string {
  const organization = config.organization || 'No organization';
  const project = config.provider === 'github' || config.provider === 'gitlab'
    ? (selectedRepositoryName || config.project || 'Todos los repositorios')
    : (selectedProjectName || config.project || 'Sin proyecto');
  const repository = selectedRepositoryName || 'Todos los repositorios';

  if (!config.provider) {
    return 'Selecciona un provider en Settings';
  }

  return config.provider === 'github' || config.provider === 'gitlab'
    ? `${organization} / ${project}`
    : `${organization} / ${project} / ${repository}`;
}

export function buildDiagnostics(
  operation: AzureDiagnostics['operation'],
  nextConfig: SavedConnectionConfig,
  lastError: string | null = null,
): AzureDiagnostics {
  const organization = nextConfig.organization.trim();
  const project = nextConfig.project.trim();
  const repositoryId = nextConfig.repositoryId?.trim() || '';
  const requestPath = nextConfig.provider === 'github'
    ? operation === 'projects' || operation === 'repositories'
      ? 'https://api.github.com/user/repos'
      : operation === 'pullRequests'
        ? (repositoryId || project
          ? `https://api.github.com/repos/${organization}/${repositoryId || project}/pulls`
          : 'https://api.github.com/user/repos -> /repos/{owner}/{repo}/pulls')
        : ''
    : nextConfig.provider === 'gitlab'
      ? operation === 'projects' || operation === 'repositories'
        ? 'https://gitlab.com/api/v4/projects'
        : operation === 'pullRequests'
          ? (repositoryId || project
            ? `https://gitlab.com/api/v4/projects/${encodeURIComponent(repositoryId || project)}/merge_requests`
            : 'https://gitlab.com/api/v4/projects -> /projects/{id}/merge_requests')
          : ''
    : operation === 'projects'
      ? `https://dev.azure.com/${organization}/_apis/projects`
      : operation === 'repositories'
        ? `https://dev.azure.com/${organization}/${project}/_apis/git/repositories`
        : operation === 'pullRequests'
          ? `https://dev.azure.com/${organization}/${project}/_apis/git/pullrequests`
          : '';

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
