import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_CHANNELS = new Set([
  'window-controls:get-state',
  'window-controls:minimize',
  'window-controls:toggle-maximize',
  'window-controls:close',
  'repository-source:fetchPullRequests',
  'repository-source:fetchProjects',
  'repository-source:fetchRepositories',
  'repository-source:fetchBranches',
  'repository-source:openExternal',
  'analysis:previewRepositorySnapshot',
  'analysis:previewPullRequestAiReviews',
  'analysis:runRepositoryAnalysis',
  'analysis:cancelRepositoryAnalysis',
  'analysis:runPullRequestAiReviews',
  'analysis:cancelPullRequestAiReviews',
  'session-secrets:get',
  'session-secrets:has',
  'session-secrets:set',
]);

export type ElectronInvokeChannel = typeof ALLOWED_CHANNELS extends Set<infer T> ? T : never;
export const allowedElectronInvokeChannels = Array.from(ALLOWED_CHANNELS);
const WINDOW_STATE_EVENT = 'window-controls:state-changed';

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
  onWindowStateChange(listener: (payload: unknown) => void) {
    const wrappedListener = (_event: unknown, payload: unknown) => {
      listener(payload);
    };

    ipcRenderer.on(WINDOW_STATE_EVENT, wrappedListener);

    return () => {
      ipcRenderer.removeListener(WINDOW_STATE_EVENT, wrappedListener);
    };
  },
};

contextBridge.exposeInMainWorld('electronApi', electronApiBridge);
