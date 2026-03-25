const repositorySourceBridge = require('../../../src/renderer/features/repository-source/data/repositorySourceBridge');

describe('repository source bridge gateway', () => {
  beforeEach(() => {
    global.window = {
      electronApi: {
        invoke: jest.fn(),
      },
    };
  });

  test('resuelve canales genericos del gateway de repository source', () => {
    expect(repositorySourceBridge.getRepositorySourceChannel('pullRequests')).toBe('repository-source:fetchPullRequests');
    expect(repositorySourceBridge.getRepositorySourceChannel('projects')).toBe('repository-source:fetchProjects');
    expect(repositorySourceBridge.getRepositorySourceChannel('repositories')).toBe('repository-source:fetchRepositories');
    expect(repositorySourceBridge.getRepositorySourceChannel('branches')).toBe('repository-source:fetchBranches');
    expect(repositorySourceBridge.getRepositorySourceChannel('openExternal')).toBe('repository-source:openExternal');
  });

  test('fetchPullRequests usa electronApi.invoke y retorna data', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: true,
      data: [{ id: 1, title: 'PR', reviewers: [] }],
    });

    const result = await repositorySourceBridge.fetchPullRequests({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    });

    expect(window.electronApi.invoke).toHaveBeenCalledWith('repository-source:fetchPullRequests', expect.objectContaining({
      organization: 'acme',
      repositoryId: 'repo-a',
      provider: 'github',
    }));
    expect(result).toEqual([{ id: 1, title: 'PR', reviewers: [] }]);
  });

  test('falla si no hay provider seleccionado', async () => {
    await expect(repositorySourceBridge.fetchProjects({
      provider: '',
      organization: '',
      project: '',
      personalAccessToken: '',
    })).rejects.toThrow('Selecciona un provider');
  });

  test('fetchRepositories y fetchBranches usan los canales correctos', async () => {
    window.electronApi.invoke
      .mockResolvedValueOnce({
        ok: true,
        data: [{ id: 'repo-a', name: 'Repo A' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        data: [{ name: 'main', objectId: '1', isDefault: true }],
      });

    const config = {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    };

    await expect(repositorySourceBridge.fetchRepositories(config)).resolves.toEqual([
      { id: 'repo-a', name: 'Repo A' },
    ]);
    await expect(repositorySourceBridge.fetchBranches(config)).resolves.toEqual([
      { name: 'main', objectId: '1', isDefault: true },
    ]);

    expect(window.electronApi.invoke).toHaveBeenNthCalledWith(1, 'repository-source:fetchRepositories', config);
    expect(window.electronApi.invoke).toHaveBeenNthCalledWith(2, 'repository-source:fetchBranches', config);
  });

  test('openReviewItem propaga errores del bridge', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: false,
      error: 'blocked',
    });

    await expect(repositorySourceBridge.openReviewItem('https://github.com/acme/repo/pull/1', {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    })).rejects.toThrow('blocked');
  });

  test('fetchProjects falla con un error controlado cuando no existe Electron', async () => {
    delete window.electronApi;

    await expect(repositorySourceBridge.fetchProjects({
      provider: 'github',
      organization: 'IanStuardo-Dev',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    })).rejects.toThrow('No se detecto el bridge de Electron');
  });

  test('openReviewItem falla con un error controlado cuando no existe Electron', async () => {
    delete window.electronApi;

    await expect(repositorySourceBridge.openReviewItem('https://github.com/acme/repo/pull/1', {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    })).rejects.toThrow('No se detecto el bridge de Electron');
  });
});

