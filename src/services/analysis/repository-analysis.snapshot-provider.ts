import type { RepositoryAnalysisRequest } from '../../types/analysis';
import { getRepositoryProviderPort } from '../providers/repository-provider.registry';
import type { SnapshotProviderPort } from './repository-analysis.ports';

export class RepositoryAnalysisSnapshotProvider implements SnapshotProviderPort {
  constructor(
    private readonly providerResolver: typeof getRepositoryProviderPort = getRepositoryProviderPort,
  ) {}

  async getSnapshot(request: RepositoryAnalysisRequest) {
    const provider = this.providerResolver(request.source.provider);
    const sourceConfig = {
      ...request.source,
      repositoryId: request.repositoryId,
      project: request.source.provider === 'azure-devops'
        ? request.source.project
        : request.repositoryId || request.source.project,
    };

    const options = {
      branchName: request.branchName,
      maxFiles: request.maxFilesPerRun,
      includeTests: request.includeTests,
    };

    return provider.getRepositorySnapshot(sourceConfig, options);
  }
}
