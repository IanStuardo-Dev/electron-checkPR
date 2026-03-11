const dashboardIpc = require('../src/renderer/features/dashboard/ipc');

describe('dashboard ipc provider gateway', () => {
  beforeEach(() => {
    global.window = {
      electronApi: {
        invoke: jest.fn(),
      },
    };
  });

  test('resuelve canales genericos del gateway de repository source', () => {
    expect(dashboardIpc.getRepositorySourceChannel('pullRequests')).toBe('repository-source:fetchPullRequests');
    expect(dashboardIpc.getRepositorySourceChannel('repositories')).toBe('repository-source:fetchRepositories');
    expect(dashboardIpc.getRepositorySourceChannel('openExternal')).toBe('repository-source:openExternal');
  });

  test('fetchPullRequests usa electronApi.invoke y retorna data', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: true,
      data: [{ id: 1, title: 'PR', reviewers: [] }],
    });

    const result = await dashboardIpc.fetchPullRequests({
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
    await expect(dashboardIpc.fetchProjects({
      provider: '',
      organization: '',
      project: '',
      personalAccessToken: '',
    })).rejects.toThrow('Selecciona un provider');
  });

  test('openReviewItem propaga errores del canal IPC', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: false,
      error: 'blocked',
    });

    await expect(dashboardIpc.openReviewItem('https://github.com/acme/repo/pull/1', {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    })).rejects.toThrow('blocked');
  });
});
