import type { RepositoryConnectionConfig, RepositoryProject, RepositorySummary } from '../../types/repository';
import { readJsonResponse } from '../shared/http-response';

export const GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';

export function getGitLabConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'personalAccessToken'>> & { project: string } {
  const organization = config.organization.trim()
    .replace(/^https?:\/\/gitlab\.com\//, '')
    .replace(/^gitlab\.com\//, '')
    .replace(/\/+$/, '');
  const personalAccessToken = config.personalAccessToken.trim();
  const project = (config.repositoryId || config.project || '').trim().replace(/^\/+|\/+$/g, '');

  return {
    organization,
    personalAccessToken,
    project,
  };
}

export async function readGitLabResponse<T>(response: Response, context: string): Promise<T> {
  return readJsonResponse<T>(response, {
    providerLabel: 'GitLab',
    context,
    forbiddenHint: 'Revisa scopes del token.',
  });
}

export async function requestGitLabJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'PRIVATE-TOKEN': personalAccessToken,
    },
  });

  return readGitLabResponse<T>(response, context);
}

export async function requestGitLabPaginated<T>(
  buildUrl: (page: number, perPage: number) => string,
  personalAccessToken: string,
  context: string,
  perPage = 100,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const payload = await requestGitLabJson<T[]>(
      buildUrl(page, perPage),
      personalAccessToken,
      `${context} (page ${page})`,
    );

    items.push(...payload);

    if (payload.length < perPage) {
      break;
    }

    page += 1;
  }

  return items;
}

export async function requestPaginatedGitLabTree<T extends { path: string; type: 'blob' | 'tree' }>(
  project: string,
  branchName: string,
  personalAccessToken: string,
): Promise<T[]> {
  const items: T[] = [];
  const perPage = 100;
  let page = 1;

  while (true) {
    const payload = await requestGitLabJson<T[]>(
      `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(project)}/repository/tree?ref=${encodeURIComponent(branchName)}&recursive=true&per_page=${perPage}&page=${page}`,
      personalAccessToken,
      `repository tree request (page ${page})`,
    );

    items.push(...payload);

    if (payload.length < perPage) {
      break;
    }

    page += 1;
  }

  return items;
}

export function normalizeNamespace(value: string): string {
  return value.toLowerCase();
}

export function buildProject(project: { path_with_namespace: string; name?: string }): RepositoryProject {
  return {
    id: project.path_with_namespace,
    name: project.name || project.path_with_namespace,
    state: 'active',
  };
}

export function buildRepository(project: { path_with_namespace: string; web_url: string; default_branch?: string }): RepositorySummary {
  return {
    id: project.path_with_namespace,
    name: project.path_with_namespace,
    webUrl: project.web_url,
    defaultBranch: project.default_branch,
  };
}
