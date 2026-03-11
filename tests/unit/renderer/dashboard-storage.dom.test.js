const storage = require('../../../src/renderer/features/dashboard/storage');

describe('dashboard storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.electronApi.invoke.mockReset();
  });

  test('loadConnectionConfig devuelve defaults cuando no hay sesion', () => {
    expect(storage.loadConnectionConfig()).toEqual(storage.defaultConnectionConfig);
  });

  test('loadConnectionConfig limpia legacy localStorage y conserva config segura', () => {
    window.sessionStorage.setItem(storage.DASHBOARD_SESSION_CONFIG_KEY, JSON.stringify({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
    }));
    window.localStorage.setItem(storage.DASHBOARD_STORAGE_KEY, 'legacy');
    window.localStorage.setItem(storage.DASHBOARD_SAVED_CONTEXTS_KEY, 'legacy-contexts');

    const config = storage.loadConnectionConfig();

    expect(config).toMatchObject({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: '',
    });
    expect(window.localStorage.getItem(storage.DASHBOARD_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(storage.DASHBOARD_SAVED_CONTEXTS_KEY)).toBeNull();
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

    expect(JSON.parse(window.sessionStorage.getItem(storage.DASHBOARD_SESSION_CONFIG_KEY))).toEqual({
      provider: 'gitlab',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: 'ian',
    });
    expect(window.electronApi.invoke).toHaveBeenCalledWith('session-secrets:set', {
      key: storage.DASHBOARD_SESSION_PAT_KEY,
      value: 'secret',
    });
  });

  test('hydrateConnectionSecret lee el secreto desde ipc', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: 'stored-secret' });

    await expect(storage.hydrateConnectionSecret()).resolves.toBe('stored-secret');
  });
});
