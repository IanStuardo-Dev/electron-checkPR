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

  test('loadConnectionConfig conserva config segura sin tocar la migracion legacy', () => {
    window.sessionStorage.setItem(storage.REPOSITORY_SOURCE_SESSION_CONFIG_KEY, JSON.stringify({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
    }));
    window.localStorage.setItem('checkpr.azure.config', 'legacy');
    window.localStorage.setItem('checkpr.azure.saved-contexts', 'legacy-contexts');

    const config = storage.loadConnectionConfig();

    expect(config).toMatchObject({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: '',
    });
    expect(window.localStorage.getItem('checkpr.azure.config')).toBe('legacy');
    expect(window.localStorage.getItem('checkpr.azure.saved-contexts')).toBe('legacy-contexts');
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
      key: storage.REPOSITORY_SOURCE_SESSION_SECRET_KEY,
      value: 'secret',
    });
  });

  test('hydrateConnectionSecret lee el secreto desde ipc', async () => {
    window.electronApi.invoke.mockImplementation(async (channel, key) => {
      if (channel === 'session-secrets:get' && key === storage.REPOSITORY_SOURCE_SESSION_SECRET_KEY) {
        return { ok: true, data: 'stored-secret' };
      }

      return { ok: true, data: '' };
    });

    await expect(storage.hydrateConnectionSecret()).resolves.toBe('stored-secret');
  });

  test('migrateLegacyRepositorySourceStorage migra el secreto legacy si existe', async () => {
    window.electronApi.invoke.mockImplementation(async (channel, payload) => {
      if (channel === 'session-secrets:get' && payload === storage.REPOSITORY_SOURCE_SESSION_SECRET_KEY) {
        return { ok: true, data: '' };
      }

      if (channel === 'session-secrets:get' && payload === 'checkpr.azure.session.pat') {
        return { ok: true, data: 'legacy-secret' };
      }

      return { ok: true, data: null };
    });

    await expect(storage.migrateLegacyRepositorySourceStorage()).resolves.toBeUndefined();
    expect(window.electronApi.invoke).toHaveBeenCalledWith('session-secrets:set', {
      key: storage.REPOSITORY_SOURCE_SESSION_SECRET_KEY,
      value: 'legacy-secret',
    });
    expect(window.electronApi.invoke).toHaveBeenCalledWith('session-secrets:set', {
      key: 'checkpr.azure.session.pat',
      value: '',
    });
  });

  test('hydrateConnectionSecret solo lee el secreto actual', async () => {
    window.electronApi.invoke.mockImplementation(async (channel, key) => {
      if (channel === 'session-secrets:get' && key === storage.REPOSITORY_SOURCE_SESSION_SECRET_KEY) {
        return { ok: true, data: '' };
      }

      return { ok: true, data: 'legacy-secret' };
    });

    await expect(storage.hydrateConnectionSecret()).resolves.toBe('');
    expect(window.electronApi.invoke).not.toHaveBeenCalledWith('session-secrets:get', 'checkpr.azure.session.pat');
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

  test('persistConnectionConfig falla si no existe Electron', async () => {
    const originalElectronApi = window.electronApi;
    delete window.electronApi;

    try {
      await expect(storage.persistConnectionConfig({
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'browser-secret',
        targetReviewer: '',
      })).rejects.toThrow('No se detecto el bridge de Electron');

      await expect(storage.hydrateConnectionSecret()).rejects.toThrow('No se detecto el bridge de Electron');
    } finally {
      window.electronApi = originalElectronApi;
    }
  });

  test('migrateLegacyRepositorySourceStorage limpia storage legacy y el secreto azure anterior', async () => {
    window.localStorage.setItem('checkpr.azure.config', 'legacy');
    window.localStorage.setItem('checkpr.azure.saved-contexts', 'legacy-contexts');
    window.electronApi.invoke.mockImplementation(async (channel, key) => {
      if (channel === 'session-secrets:get' && key === storage.REPOSITORY_SOURCE_SESSION_SECRET_KEY) {
        return { ok: true, data: 'secret' };
      }

      return { ok: true, data: null };
    });

    await storage.migrateLegacyRepositorySourceStorage();

    expect(window.localStorage.getItem('checkpr.azure.config')).toBeNull();
    expect(window.localStorage.getItem('checkpr.azure.saved-contexts')).toBeNull();
    expect(window.electronApi.invoke).toHaveBeenCalledWith('session-secrets:set', {
      key: 'checkpr.azure.session.pat',
      value: '',
    });
  });
});
