import type { RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySummary } from '../../types/repository';
import { getGitHubConfig, requestGitHubJson, requestGitHubPaginated } from './github.api';
import type { GitHubBranchResponse, GitHubRepositoryResponse } from './github.types';

function buildRepositorySummary(repository: GitHubRepositoryResponse): RepositorySummary {
  return {
    id: repository.name,
    name: repository.name,
    webUrl: repository.html_url,
    defaultBranch: repository.default_branch,
  };
}

export async function getGitHubRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
  const { organization, personalAccessToken } = getGitHubConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Owner/organization y token son obligatorios para GitHub.');
  }

  const allRepositories = await requestGitHubPaginated<GitHubRepositoryResponse>(
    'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
    personalAccessToken,
    'repositories request',
  );

  return allRepositories
    .filter((repository) => repository.owner.login.toLowerCase() === organization.toLowerCase())
    .map(buildRepositorySummary);
}

export async function getGitHubProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
  const repositories = await getGitHubRepositories(config);

  return repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    state: 'active',
  }));
}

export async function getGitHubBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
  const { organization, personalAccessToken, repository } = getGitHubConfig(config);

  if (!organization || !repository || !personalAccessToken) {
    throw new Error('Owner/organization, repository y token son obligatorios para GitHub.');
  }

  const repositoryDetails = await requestGitHubJson<GitHubRepositoryResponse>(
    `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}`,
    personalAccessToken,
    'repository request',
  );
  const payload = await requestGitHubPaginated<GitHubBranchResponse>(
    `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(repository)}/branches?per_page=100`,
    personalAccessToken,
    'branches request',
  );

  return payload.map((branch) => ({
    name: branch.name,
    objectId: branch.commit.sha,
    isDefault: branch.name === repositoryDetails.default_branch,
  }));
}
