import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_BRIDGE_COMMANDS = new Set([
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

export type ElectronBridgeCommand = typeof ALLOWED_BRIDGE_COMMANDS extends Set<infer T> ? T : never;
export const allowedElectronBridgeCommands = Array.from(ALLOWED_BRIDGE_COMMANDS);
const WINDOW_STATE_EVENT = 'window-controls:state-changed';

export function ensureAllowedBridgeCommand(command: string): void {
  if (!ALLOWED_BRIDGE_COMMANDS.has(command)) {
    throw new Error(`Bridge command ${command} is not allowed.`);
  }
}

export const electronApiBridge = {
  invoke(command: string, payload?: unknown) {
    ensureAllowedBridgeCommand(command);
    return ipcRenderer.invoke(command, payload);
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
