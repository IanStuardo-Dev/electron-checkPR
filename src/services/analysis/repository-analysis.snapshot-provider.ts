import type { RepositoryAnalysisRequest } from '../../types/analysis';
import type { SnapshotProviderPort } from './repository-analysis.ports';
import type { RepositorySnapshotProviderPort } from '../providers/repository-provider.port';
import type { RepositoryProviderKind } from '../../types/repository';
import {
  resolveRepositoryAnalysisSourceConfig,
  type RepositoryAnalysisSourceResolver,
} from './repository-analysis.source-resolver';

interface RepositorySnapshotProviderRegistryPort {
  get(kind: RepositoryProviderKind): RepositorySnapshotProviderPort;
}

export class RepositoryAnalysisSnapshotProvider implements SnapshotProviderPort {
  constructor(
    private readonly providerRegistry: RepositorySnapshotProviderRegistryPort,
    private readonly sourceResolver: RepositoryAnalysisSourceResolver = resolveRepositoryAnalysisSourceConfig,
  ) {}

  async getSnapshot(request: RepositoryAnalysisRequest) {
    const provider = this.providerRegistry.get(request.source.provider);
    const sourceConfig = this.sourceResolver(request);

    const options = {
      branchName: request.branchName,
      maxFiles: request.maxFilesPerRun,
      includeTests: request.includeTests,
      excludedPathPatterns: request.snapshotPolicy?.excludedPathPatterns,
    };

    return provider.getRepositorySnapshot(sourceConfig, options);
  }
}
