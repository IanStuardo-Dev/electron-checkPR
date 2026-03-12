import type { PullRequestSnapshotOptions, RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySnapshotOptions, RepositorySummary, ReviewItem } from '../../types/repository';
import type { PullRequestSnapshot, RepositorySnapshot } from '../../types/analysis';
import { getGitHubConfig, readGitHubResponse } from './github.api';
import { getGitHubBranches, getGitHubProjects, getGitHubRepositories } from './github.repositories';
import { getGitHubPullRequests } from './github.pull-requests';
import { getGitHubPullRequestSnapshot } from './github.pr-snapshot';
import { enumerateGitHubContents, getGitHubRepositorySnapshot } from './github.snapshot';

export class GitHubRepositoryService {
  async getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
    return getGitHubProjects(config);
  }

  async getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
    return getGitHubRepositories(config);
  }

  async getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
    return getGitHubBranches(config);
  }

  async getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
    return getGitHubPullRequests(config);
  }

  async getPullRequestSnapshot(
    config: RepositoryConnectionConfig,
    pullRequest: ReviewItem,
    options: PullRequestSnapshotOptions,
  ): Promise<PullRequestSnapshot> {
    return getGitHubPullRequestSnapshot(config, pullRequest, options);
  }

  async getRepositorySnapshot(
    config: RepositoryConnectionConfig,
    options: RepositorySnapshotOptions,
  ): Promise<RepositorySnapshot> {
    return getGitHubRepositorySnapshot(config, options);
  }
}

export const gitHubRepositoryServiceInternals = {
  getGitHubConfig,
  readGitHubResponse,
  enumerateGitHubContents,
};

export const gitHubRepositoryService = new GitHubRepositoryService();
