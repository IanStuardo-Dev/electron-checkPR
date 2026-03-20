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

export interface RepositoryProviderBasePort {
  readonly kind: RepositoryProviderKind;
}

export interface RepositorySourceProviderPort extends RepositoryProviderBasePort {
  getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]>;
  getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]>;
  getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]>;
  getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]>;
}

export interface PullRequestSnapshotProviderPort extends RepositoryProviderBasePort {
  getPullRequestSnapshot(config: RepositoryConnectionConfig, pullRequest: ReviewItem, options: PullRequestSnapshotOptions): Promise<PullRequestSnapshot>;
}

export interface RepositorySnapshotProviderPort extends RepositoryProviderBasePort {
  getRepositorySnapshot(config: RepositoryConnectionConfig, options: RepositorySnapshotOptions): Promise<RepositorySnapshot>;
}

export interface RepositoryProviderPort
  extends RepositorySourceProviderPort,
  PullRequestSnapshotProviderPort,
  RepositorySnapshotProviderPort {}

export type RepositoryProviderService = Omit<RepositoryProviderPort, 'kind'>;

export type RepositoryAnalysisSource = RepositoryAnalysisRequest['source'];
