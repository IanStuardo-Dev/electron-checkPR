import type { RepositorySnapshot, RepositoryAnalysisRequest } from '../../types/analysis';
import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
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
  getRepositorySnapshot(config: RepositoryConnectionConfig, options: RepositorySnapshotOptions): Promise<RepositorySnapshot>;
}

export type RepositoryAnalysisSource = RepositoryAnalysisRequest['source'];
