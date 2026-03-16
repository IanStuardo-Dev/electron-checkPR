const storage = require('../../../src/renderer/features/repository-source/data/repositorySourceStorage');

describe('repository source storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.electronApi.invoke.mockReset();
  });

  test('loadConnectionConfig devuelve defaults cuando no hay sesion', () => {
    expect(storage.loadConnectionConfig()).toEqual(storage.defaultConnectionConfig);
  });

  test('loadConnectionConfig limpia legacy localStorage y conserva config segura', () => {
    window.sessionStorage.setItem(storage.REPOSITORY_SOURCE_SESSION_CONFIG_KEY, JSON.stringify({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
    }));
    window.localStorage.setItem(storage.REPOSITORY_SOURCE_STORAGE_KEY, 'legacy');
    window.localStorage.setItem(storage.REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY, 'legacy-contexts');

    const config = storage.loadConnectionConfig();

    expect(config).toMatchObject({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: '',
    });
    expect(window.localStorage.getItem(storage.REPOSITORY_SOURCE_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(storage.REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY)).toBeNull();
  });

  test('persistConnectionConfig guarda config segura y secreto en sesion', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: null });

    await storage.persistConnectionConfig({
      provider: 'gitlab',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
      targetReviewer: 'ian',
    });

    expect(JSON.parse(window.sessionStorage.getItem(storage.REPOSITORY_SOURCE_SESSION_CONFIG_KEY))).toEqual({
      provider: 'gitlab',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: 'ian',
    });
    expect(window.electronApi.invoke).toHaveBeenCalledWith('session-secrets:set', {
      key: storage.REPOSITORY_SOURCE_SESSION_PAT_KEY,
      value: 'secret',
    });
  });

  test('hydrateConnectionSecret lee el secreto desde ipc', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: 'stored-secret' });

    await expect(storage.hydrateConnectionSecret()).resolves.toBe('stored-secret');
  });

  test('loadConnectionConfig tolera JSON invalido en sesion', () => {
    window.sessionStorage.setItem(storage.REPOSITORY_SOURCE_SESSION_CONFIG_KEY, '{invalid');
    expect(storage.loadConnectionConfig()).toEqual(storage.defaultConnectionConfig);
  });

  test('persistConnectionConfig propaga error si session-secrets falla', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: false, error: 'secret failed' });

    await expect(storage.persistConnectionConfig({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
      targetReviewer: '',
    })).rejects.toThrow('secret failed');
  });

  test('hydrateConnectionSecret propaga error de ipc', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: false, error: 'missing secret' });
    await expect(storage.hydrateConnectionSecret()).rejects.toThrow('missing secret');
  });

  test('persistConnectionConfig usa fallback de sessionStorage sin Electron', async () => {
    const originalElectronApi = window.electronApi;
    delete window.electronApi;

    try {
      await storage.persistConnectionConfig({
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'browser-secret',
        targetReviewer: '',
      });

      await expect(storage.hydrateConnectionSecret()).resolves.toBe('browser-secret');
    } finally {
      window.electronApi = originalElectronApi;
    }
  });

  test('saved azure contexts sigue deshabilitado y limpia legacy', () => {
    window.localStorage.setItem(storage.REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY, 'legacy-contexts');

    expect(storage.loadSavedAzureContexts()).toEqual([]);
    storage.persistSavedAzureContext(storage.defaultConnectionConfig);

    expect(window.localStorage.getItem(storage.REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY)).toBeNull();
  });
});
