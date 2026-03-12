jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
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
      'session-secrets:get',
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
});
