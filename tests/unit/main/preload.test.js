jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
    removeListener: jest.fn(),
  },
}));

const { contextBridge, ipcRenderer } = require('electron');
const preload = require('../../../src/preload');

describe('preload security bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('expone el catalogo de canales permitidos', () => {
    expect(preload.allowedElectronInvokeChannels).toEqual(expect.arrayContaining([
      'repository-source:fetchPullRequests',
      'analysis:previewRepositorySnapshot',
      'analysis:runRepositoryAnalysis',
      'analysis:cancelPullRequestAiReviews',
      'window-controls:get-state',
      'window-controls:close',
      'session-secrets:get',
      'session-secrets:has',
    ]));
  });

  test('bloquea canales IPC no permitidos', () => {
    expect(() => preload.ensureAllowedChannel('evil:channel')).toThrow('IPC channel evil:channel is not allowed.');
  });

  test('electronApiBridge.invoke valida canal antes de delegar en ipcRenderer', async () => {
    ipcRenderer.invoke.mockResolvedValue({ ok: true });

    await expect(preload.electronApiBridge.invoke('session-secrets:get', 'key-a')).resolves.toEqual({ ok: true });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('session-secrets:get', 'key-a');
  });

  test('permite suscribirse y desuscribirse a cambios de estado de la ventana', () => {
    const listener = jest.fn();
    const unsubscribe = preload.electronApiBridge.onWindowStateChange(listener);

    expect(ipcRenderer.on).toHaveBeenCalledWith('window-controls:state-changed', expect.any(Function));

    const wrappedHandler = ipcRenderer.on.mock.calls[0][1];
    wrappedHandler({}, { isMaximized: true });
    expect(listener).toHaveBeenCalledWith({ isMaximized: true });

    unsubscribe();
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith('window-controls:state-changed', wrappedHandler);
  });
});
