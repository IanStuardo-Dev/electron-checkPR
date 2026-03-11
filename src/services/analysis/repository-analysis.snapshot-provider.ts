import type { RepositoryAnalysisRequest } from '../../types/analysis';
import type { SnapshotProviderPort } from './repository-analysis.ports';
import type { RepositoryProviderRegistry } from '../providers/repository-provider.registry';

export class RepositoryAnalysisSnapshotProvider implements SnapshotProviderPort {
  constructor(
    private readonly providerRegistry: RepositoryProviderRegistry,
  ) {}

  async getSnapshot(request: RepositoryAnalysisRequest) {
    const provider = this.providerRegistry.get(request.source.provider);
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
