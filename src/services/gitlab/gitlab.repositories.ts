import type { RepositoryBranch, RepositoryConnectionConfig, RepositoryProject, RepositorySummary } from '../../types/repository';
import { buildProject, buildRepository, GITLAB_API_BASE_URL, getGitLabConfig, normalizeNamespace, requestGitLabJson, requestGitLabPaginated } from './gitlab.api';
import type { GitLabBranchResponse, GitLabProjectResponse } from './gitlab.types';

export async function getGitLabRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]> {
  const { organization, personalAccessToken } = getGitLabConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Namespace/group y token son obligatorios para GitLab.');
  }

  const payload = await requestGitLabPaginated<GitLabProjectResponse>(
    (page, perPage) => `${GITLAB_API_BASE_URL}/projects?membership=true&simple=true&per_page=${perPage}&page=${page}&order_by=last_activity_at&sort=desc`,
    personalAccessToken,
    'projects request',
  );

  const normalizedNamespace = normalizeNamespace(organization);

  return payload
    .filter((project) => normalizeNamespace(project.path_with_namespace).startsWith(`${normalizedNamespace}/`))
    .map(buildRepository);
}

export async function getGitLabProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]> {
  const repositories = await getGitLabRepositories(config);
  return repositories.map((repository) => buildProject({
    path_with_namespace: repository.id,
    name: repository.name,
  }));
}

export async function getGitLabBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]> {
  const { personalAccessToken, project } = getGitLabConfig(config);

  if (!project || !personalAccessToken) {
    throw new Error('Proyecto y token son obligatorios para GitLab.');
  }

  const payload = await requestGitLabJson<GitLabBranchResponse[]>(
    `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/branches?per_page=100`,
    personalAccessToken,
    'branches request',
  );

  return payload.map((branch) => ({
    name: branch.name,
    objectId: branch.commit.id,
    isDefault: branch.default,
  }));
}
