import type { RepositoryBranch, RepositoryProject, RepositorySummary, ReviewItem } from '../../../types/repository';
import type { SavedConnectionConfig } from './types';

interface IpcSuccessResponse<T> {
  ok: true;
  data: T;
}

interface IpcErrorResponse {
  ok: false;
  error: string;
}

type IpcResponse<T> = IpcSuccessResponse<T> | IpcErrorResponse;

async function invokeIpc<T>(channel: string, payload?: unknown): Promise<T> {
  const response = await window.electronApi.invoke(channel, payload) as IpcResponse<T>;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

export function getRepositorySourceChannel(operation: 'pullRequests' | 'projects' | 'repositories' | 'branches' | 'openExternal'): string {
  const channelMap = {
    pullRequests: 'repository-source:fetchPullRequests',
    projects: 'repository-source:fetchProjects',
    repositories: 'repository-source:fetchRepositories',
    branches: 'repository-source:fetchBranches',
    openExternal: 'repository-source:openExternal',
  } satisfies Record<typeof operation, string>;

  return channelMap[operation];
}

function ensureProviderSelected(config: SavedConnectionConfig): void {
  if (!config.provider) {
    throw new Error('Selecciona un provider antes de ejecutar esta accion.');
  }
}

export async function fetchPullRequests(config: SavedConnectionConfig): Promise<ReviewItem[]> {
  ensureProviderSelected(config);
  return invokeIpc<ReviewItem[]>(getRepositorySourceChannel('pullRequests'), config);
}

export async function fetchProjects(config: SavedConnectionConfig): Promise<RepositoryProject[]> {
  ensureProviderSelected(config);
  return invokeIpc<RepositoryProject[]>(getRepositorySourceChannel('projects'), config);
}

export async function fetchRepositories(config: SavedConnectionConfig): Promise<RepositorySummary[]> {
  ensureProviderSelected(config);
  return invokeIpc<RepositorySummary[]>(getRepositorySourceChannel('repositories'), config);
}

export async function fetchBranches(config: SavedConnectionConfig): Promise<RepositoryBranch[]> {
  ensureProviderSelected(config);
  return invokeIpc<RepositoryBranch[]>(getRepositorySourceChannel('branches'), config);
}

export async function openReviewItem(url: string, config: SavedConnectionConfig): Promise<void> {
  ensureProviderSelected(config);
  await invokeIpc<void>(getRepositorySourceChannel('openExternal'), url);
}
