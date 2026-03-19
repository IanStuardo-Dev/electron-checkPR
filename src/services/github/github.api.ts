import type { RepositoryConnectionConfig } from '../../types/repository';
import { readJsonResponse } from '../../shared/http-response';

const GITHUB_API_VERSION = '2022-11-28';

export interface GitHubContentFileResponse {
  type: 'file';
  path: string;
  size: number;
  content: string;
  encoding: string;
}

export interface GitHubContentDirectoryItem {
  type: 'file' | 'dir';
  path: string;
  size: number;
}

export function getGitHubConfig(config: RepositoryConnectionConfig): Required<Pick<RepositoryConnectionConfig, 'organization' | 'personalAccessToken'>> & { repository: string } {
  const organization = config.organization.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/+$/, '');
  const personalAccessToken = config.personalAccessToken.trim();
  const repository = (config.repositoryId || config.project || '').trim().replace(/^\/+|\/+$/g, '');

  return {
    organization,
    personalAccessToken,
    repository,
  };
}

export async function readGitHubResponse<T>(response: Response, context: string): Promise<T> {
  return readJsonResponse<T>(response, {
    providerLabel: 'GitHub',
    context,
    forbiddenHint: 'Revisa scopes del token.',
  });
}

export async function requestGitHubJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${personalAccessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  return readGitHubResponse<T>(response, context);
}

export async function requestGitHubJsonResponse<T>(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${personalAccessToken}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
  });

  return {
    data: await readGitHubResponse<T>(response, context),
    headers: response.headers,
  };
}

export function getGitHubNextPage(headers: Headers): string | null {
  const linkHeader = headers.get('link');
  if (!linkHeader) {
    return null;
  }

  const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return nextMatch?.[1] || null;
}

export async function requestGitHubPaginated<T>(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await requestGitHubJsonResponse<T[]>(nextUrl, personalAccessToken, context);
    results.push(...response.data);
    nextUrl = getGitHubNextPage(response.headers);
  }

  return results;
}

export async function requestGitHubContent(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<GitHubContentFileResponse | GitHubContentDirectoryItem[]> {
  return requestGitHubJson<GitHubContentFileResponse | GitHubContentDirectoryItem[]>(url, personalAccessToken, context);
}
