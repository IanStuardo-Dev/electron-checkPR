import type { AzureBranch, AzureConnectionConfig, AzureProject, AzureRepository, PullRequest } from '../../types/azure';
import type { PullRequestSnapshot, RepositorySnapshot } from '../../types/analysis';
import type { PullRequestSnapshotOptions, RepositorySnapshotOptions } from '../../types/repository';
import { normalizeOrganization, normalizeProject, readAzureResponse } from './azure.api';
import { getAzureBranches, getAzureProjects, getAzureRepositories } from './azure.repositories';
import { getAzurePullRequests } from './azure.pull-requests';
import { getAzurePullRequestSnapshot } from './azure.pr-snapshot';
import { getAzureRepositorySnapshot } from './azure.snapshot';

export class PullRequestService {
  async getProjects(config: AzureConnectionConfig): Promise<AzureProject[]> {
    return getAzureProjects(config);
  }

  async getRepositories(config: AzureConnectionConfig): Promise<AzureRepository[]> {
    return getAzureRepositories(config);
  }

  async getBranches(config: AzureConnectionConfig): Promise<AzureBranch[]> {
    return getAzureBranches(config);
  }

  async getPullRequests(config: AzureConnectionConfig): Promise<PullRequest[]> {
    return getAzurePullRequests(config);
  }

  async getPullRequestSnapshot(
    config: AzureConnectionConfig,
    pullRequest: PullRequest,
    options: PullRequestSnapshotOptions,
  ): Promise<PullRequestSnapshot> {
    return getAzurePullRequestSnapshot(config, pullRequest, options);
  }

  async getRepositorySnapshot(
    config: AzureConnectionConfig,
    options: RepositorySnapshotOptions,
  ): Promise<RepositorySnapshot> {
    return getAzureRepositorySnapshot(config, options);
  }
}

export const pullRequestServiceInternals = {
  normalizeOrganization,
  normalizeProject,
  readAzureResponse,
};

export const pullRequestService = new PullRequestService();
