import type { PullRequestAnalysisBatchRequest, PullRequestSnapshot } from '../../types/analysis';
import type { RepositoryProviderRegistry } from '../providers/repository-provider.registry';

export class PullRequestAnalysisSnapshotProvider {
  constructor(
    private readonly providerRegistry: RepositoryProviderRegistry,
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
