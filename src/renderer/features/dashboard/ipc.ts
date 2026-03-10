import { ipcRenderer } from 'electron';
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
  const response = await ipcRenderer.invoke(channel, payload) as IpcResponse<T>;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

function getProviderChannel(config: SavedConnectionConfig, operation: 'pullRequests' | 'projects' | 'repositories' | 'branches' | 'openExternal'): string {
  if (config.provider === 'azure-devops') {
    const channelMap = {
      pullRequests: 'azure:fetchPullRequests',
      projects: 'azure:fetchProjects',
      repositories: 'azure:fetchRepositories',
      branches: 'azure:fetchBranches',
      openExternal: 'azure:openExternal',
    } satisfies Record<typeof operation, string>;

    return channelMap[operation];
  }

  if (config.provider === 'github') {
    const channelMap = {
      pullRequests: 'github:fetchPullRequests',
      projects: 'github:fetchProjects',
      repositories: 'github:fetchRepositories',
      branches: 'github:fetchBranches',
      openExternal: 'github:openExternal',
    } satisfies Record<typeof operation, string>;

    return channelMap[operation];
  }

  throw new Error(`El provider ${config.provider} aun no tiene IPC implementado.`);
}

export async function fetchPullRequests(config: SavedConnectionConfig): Promise<ReviewItem[]> {
  return invokeIpc<ReviewItem[]>(getProviderChannel(config, 'pullRequests'), config);
}

export async function fetchProjects(config: SavedConnectionConfig): Promise<RepositoryProject[]> {
  return invokeIpc<RepositoryProject[]>(getProviderChannel(config, 'projects'), config);
}

export async function fetchRepositories(config: SavedConnectionConfig): Promise<RepositorySummary[]> {
  return invokeIpc<RepositorySummary[]>(getProviderChannel(config, 'repositories'), config);
}

export async function fetchBranches(config: SavedConnectionConfig): Promise<RepositoryBranch[]> {
  return invokeIpc<RepositoryBranch[]>(getProviderChannel(config, 'branches'), config);
}

export async function openReviewItem(url: string, config: SavedConnectionConfig): Promise<void> {
  await ipcRenderer.invoke(getProviderChannel(config, 'openExternal'), url);
}
