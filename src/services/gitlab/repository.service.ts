import type { RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySnapshotOptions, RepositorySummary, ReviewItem } from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';
import { getGitLabBranches, getGitLabProjects, getGitLabRepositories } from './gitlab.repositories';
import { getGitLabPullRequests } from './gitlab.pull-requests';
import { getGitLabRepositorySnapshot } from './gitlab.snapshot';

export class GitLabRepositoryService {
  async getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
    return getGitLabProjects(config);
  }

  async getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
    return getGitLabRepositories(config);
  }

  async getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
    return getGitLabBranches(config);
  }

  async getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
    return getGitLabPullRequests(config);
  }

  async getRepositorySnapshot(
    config: RepositoryConnectionConfig,
    options: RepositorySnapshotOptions,
  ): Promise<RepositorySnapshot> {
    return getGitLabRepositorySnapshot(config, options);
  }
}

export const gitLabRepositoryService = new GitLabRepositoryService();
