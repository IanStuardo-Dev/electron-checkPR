import type { RepositoryAnalysisRequest } from '../../types/analysis';
import type { RepositoryConnectionConfig, RepositoryProviderKind } from '../../types/repository';

export type RepositoryAnalysisSourceResolver = (
  request: RepositoryAnalysisRequest,
) => RepositoryConnectionConfig;

type ProviderSourceResolver = (
  request: RepositoryAnalysisRequest,
  defaultResolver: RepositoryAnalysisSourceResolver,
) => RepositoryConnectionConfig;

function resolveDefaultSource(request: RepositoryAnalysisRequest): RepositoryConnectionConfig {
  return {
    ...request.source,
    repositoryId: request.repositoryId,
    project: request.repositoryId || request.source.project,
  };
}

function resolveAzureDevopsSource(request: RepositoryAnalysisRequest): RepositoryConnectionConfig {
  return {
    ...request.source,
    repositoryId: request.repositoryId,
    project: request.source.project,
  };
}

const providerSourceResolvers: Partial<Record<RepositoryProviderKind, ProviderSourceResolver>> = {
  'azure-devops': (request) => resolveAzureDevopsSource(request),
};

export function resolveRepositoryAnalysisSourceConfig(request: RepositoryAnalysisRequest): RepositoryConnectionConfig {
  const providerResolver = providerSourceResolvers[request.source.provider];

  if (!providerResolver) {
    return resolveDefaultSource(request);
  }

  return providerResolver(request, resolveDefaultSource);
}
