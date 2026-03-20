import type { PullRequestAnalysisBatchRequest, PullRequestSnapshot } from '../../types/analysis';
import type { PullRequestAnalysisSnapshotProviderPort } from './pull-request-analysis.ports';
import type { PullRequestSnapshotProviderPort } from '../providers/repository-provider.port';
import type { RepositoryProviderKind } from '../../types/repository';

interface PullRequestSnapshotProviderRegistryPort {
  get(kind: RepositoryProviderKind): PullRequestSnapshotProviderPort;
}

export class PullRequestAnalysisSnapshotProvider implements PullRequestAnalysisSnapshotProviderPort {
  constructor(
    private readonly providerRegistry: PullRequestSnapshotProviderRegistryPort,
  ) {}

  async getSnapshot(
    source: PullRequestAnalysisBatchRequest['source'],
    pullRequest: PullRequestAnalysisBatchRequest['items'][number]['pullRequest'],
    snapshotPolicy: PullRequestAnalysisBatchRequest['snapshotPolicy'],
  ): Promise<PullRequestSnapshot> {
    const provider = this.providerRegistry.get(source.provider);
    return provider.getPullRequestSnapshot(source, pullRequest, {
      excludedPathPatterns: snapshotPolicy?.excludedPathPatterns,
    });
  }
}
