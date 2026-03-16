import type { RepositoryBranch, RepositoryProject, RepositorySummary, ReviewItem } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';
import { invokeIpcResponse } from '../../../shared/electron/ipcResponse';

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

function ensureProviderConfig(
  config: SavedConnectionConfig,
): asserts config is SavedConnectionConfig & { provider: Exclude<SavedConnectionConfig['provider'], ''> } {
  ensureProviderSelected(config);
}

export async function fetchPullRequests(config: SavedConnectionConfig): Promise<ReviewItem[]> {
  ensureProviderConfig(config);
  return invokeIpcResponse<ReviewItem[]>(getRepositorySourceChannel('pullRequests'), config);
}

export async function fetchProjects(config: SavedConnectionConfig): Promise<RepositoryProject[]> {
  ensureProviderConfig(config);
  return invokeIpcResponse<RepositoryProject[]>(getRepositorySourceChannel('projects'), config);
}

export async function fetchRepositories(config: SavedConnectionConfig): Promise<RepositorySummary[]> {
  ensureProviderConfig(config);
  return invokeIpcResponse<RepositorySummary[]>(getRepositorySourceChannel('repositories'), config);
}

export async function fetchBranches(config: SavedConnectionConfig): Promise<RepositoryBranch[]> {
  ensureProviderConfig(config);
  return invokeIpcResponse<RepositoryBranch[]>(getRepositorySourceChannel('branches'), config);
}

export async function openReviewItem(url: string, config: SavedConnectionConfig): Promise<void> {
  ensureProviderConfig(config);
  await invokeIpcResponse<void>(getRepositorySourceChannel('openExternal'), url);
}
