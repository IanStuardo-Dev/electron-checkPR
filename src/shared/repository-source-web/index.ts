import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositorySummary,
  ReviewItem,
} from '../../types/repository';
import {
  getAzureBranchesWeb,
  getAzureProjectsWeb,
  getAzurePullRequestsWeb,
  getAzureRepositoriesWeb,
} from './azure';
import {
  getGitHubBranchesWeb,
  getGitHubProjectsWeb,
  getGitHubPullRequestsWeb,
  getGitHubRepositoriesWeb,
} from './github';
import {
  getGitLabBranchesWeb,
  getGitLabProjectsWeb,
  getGitLabPullRequestsWeb,
  getGitLabRepositoriesWeb,
} from './gitlab';

function assertSupportedProvider(config: RepositoryConnectionConfig): void {
  if (config.provider === 'bitbucket') {
    throw new Error('Bitbucket aun no esta disponible en este entorno.');
  }
}

export async function fetchRepositorySourceProjectsWeb(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
  assertSupportedProvider(config);

  switch (config.provider) {
    case 'github':
      return getGitHubProjectsWeb(config);
    case 'gitlab':
      return getGitLabProjectsWeb(config);
    case 'azure-devops':
      return getAzureProjectsWeb(config);
    default:
      return [];
  }
}

export async function fetchRepositorySourceRepositoriesWeb(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
  assertSupportedProvider(config);

  switch (config.provider) {
    case 'github':
      return getGitHubRepositoriesWeb(config);
    case 'gitlab':
      return getGitLabRepositoriesWeb(config);
    case 'azure-devops':
      return getAzureRepositoriesWeb(config);
    default:
      return [];
  }
}

export async function fetchRepositorySourceBranchesWeb(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
  assertSupportedProvider(config);

  switch (config.provider) {
    case 'github':
      return getGitHubBranchesWeb(config);
    case 'gitlab':
      return getGitLabBranchesWeb(config);
    case 'azure-devops':
      return getAzureBranchesWeb(config);
    default:
      return [];
  }
}

export async function fetchRepositorySourcePullRequestsWeb(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
  assertSupportedProvider(config);

  switch (config.provider) {
    case 'github':
      return getGitHubPullRequestsWeb(config);
    case 'gitlab':
      return getGitLabPullRequestsWeb(config);
    case 'azure-devops':
      return getAzurePullRequestsWeb(config);
    default:
      return [];
  }
}

export function openRepositorySourceReviewItemWeb(url: string): void {
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
