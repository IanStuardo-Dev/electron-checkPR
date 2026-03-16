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
    });

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

  test('hydrateCodexApiKey propaga el valor recuperado', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: 'sk-live' });

    await expect(storage.hydrateCodexApiKey()).resolves.toBe('sk-live');
  });

  test('persistCodexConfig usa fallback de sessionStorage sin Electron', async () => {
    const originalElectronApi = window.electronApi;
    delete window.electronApi;

    try {
      await storage.persistCodexConfig({
        ...storage.defaultCodexConfig,
        enabled: true,
        apiKey: 'sk-browser',
      });

      await expect(storage.hydrateCodexApiKey()).resolves.toBe('sk-browser');
    } finally {
      window.electronApi = originalElectronApi;
    }
  });
});
