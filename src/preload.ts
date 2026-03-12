import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_CHANNELS = new Set([
  'repository-source:fetchPullRequests',
  'repository-source:fetchProjects',
  'repository-source:fetchRepositories',
  'repository-source:fetchBranches',
  'repository-source:openExternal',
  'analysis:previewRepositorySnapshot',
  'analysis:runRepositoryAnalysis',
  'analysis:cancelRepositoryAnalysis',
  'session-secrets:get',
  'session-secrets:set',
]);

export type ElectronInvokeChannel = typeof ALLOWED_CHANNELS extends Set<infer T> ? T : never;
export const allowedElectronInvokeChannels = Array.from(ALLOWED_CHANNELS);

export function ensureAllowedChannel(channel: string): void {
  if (!ALLOWED_CHANNELS.has(channel)) {
    throw new Error(`IPC channel ${channel} is not allowed.`);
  }
}

export const electronApiBridge = {
  invoke(channel: string, payload?: unknown) {
    ensureAllowedChannel(channel);
    return ipcRenderer.invoke(channel, payload);
  },
};

contextBridge.exposeInMainWorld('electronApi', electronApiBridge);
