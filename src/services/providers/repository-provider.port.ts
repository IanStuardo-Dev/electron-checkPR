import type { PullRequestSnapshot, RepositorySnapshot, RepositoryAnalysisRequest } from '../../types/analysis';
import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
  PullRequestSnapshotOptions,
  RepositoryProject,
  RepositoryProviderKind,
  RepositorySnapshotOptions,
  RepositorySummary,
  ReviewItem,
} from '../../types/repository';

export interface RepositoryProviderPort {
  readonly kind: RepositoryProviderKind;
  getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]>;
  getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]>;
  getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]>;
  getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]>;
  getPullRequestSnapshot(config: RepositoryConnectionConfig, pullRequest: ReviewItem, options: PullRequestSnapshotOptions): Promise<PullRequestSnapshot>;
  getRepositorySnapshot(config: RepositoryConnectionConfig, options: RepositorySnapshotOptions): Promise<RepositorySnapshot>;
}

export type RepositoryProviderService = Omit<RepositoryProviderPort, 'kind'>;

export type RepositoryAnalysisSource = RepositoryAnalysisRequest['source'];
