const storage = require('../../../src/renderer/features/settings/data/settingsStorage');

describe('settings storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.electronApi.invoke.mockReset();
  });

  test('loadCodexConfig devuelve defaults seguros', () => {
    expect(storage.loadCodexConfig()).toEqual(storage.defaultCodexConfig);
  });

  test('persistCodexConfig guarda api key en sesion y config sin secreto', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: null });

    await storage.persistCodexConfig({
      ...storage.defaultCodexConfig,
      enabled: true,
      apiKey: 'sk-secret',
      model: 'gpt-5.2-codex',
    }, { syncApiKey: true });

    expect(window.electronApi.invoke).toHaveBeenCalledWith('session-secrets:set', {
      key: 'checkpr.settings.codex.api-key',
      value: 'sk-secret',
    });
    expect(JSON.parse(window.localStorage.getItem('checkpr.settings.codex'))).toMatchObject({
      enabled: true,
      apiKey: '',
      model: 'gpt-5.2-codex',
    });
  });

  test('hasCodexApiKeyInSession propaga presencia de secreto', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: true });

    await expect(storage.hasCodexApiKeyInSession()).resolves.toBe(true);
  });

  test('persistCodexConfig falla si no existe Electron', async () => {
    const originalElectronApi = window.electronApi;
    delete window.electronApi;

    try {
      await expect(storage.persistCodexConfig({
        ...storage.defaultCodexConfig,
        enabled: true,
        apiKey: 'sk-browser',
      }, { syncApiKey: true })).rejects.toThrow('No se detecto el bridge de Electron');

      await expect(storage.hasCodexApiKeyInSession()).rejects.toThrow('No se detecto el bridge de Electron');
    } finally {
      window.electronApi = originalElectronApi;
    }
  });
});
