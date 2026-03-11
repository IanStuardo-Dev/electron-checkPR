const dashboardIpc = require('../dist/renderer/features/dashboard/ipc.js');

describe('dashboard ipc provider mapping', () => {
  beforeEach(() => {
    global.window = {
      electronApi: {
        invoke: jest.fn(),
      },
    };
  });

  test('resuelve canales de Azure, GitHub y GitLab', () => {
    expect(dashboardIpc.getProviderChannel({
      provider: 'azure-devops',
      organization: '',
      project: '',
      personalAccessToken: '',
    }, 'pullRequests')).toBe('azure:fetchPullRequests');

    expect(dashboardIpc.getProviderChannel({
      provider: 'github',
      organization: '',
      project: '',
      personalAccessToken: '',
    }, 'repositories')).toBe('github:fetchRepositories');

    expect(dashboardIpc.getProviderChannel({
      provider: 'gitlab',
      organization: '',
      project: '',
      personalAccessToken: '',
    }, 'openExternal')).toBe('gitlab:openExternal');
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

    expect(window.electronApi.invoke).toHaveBeenCalledWith('github:fetchPullRequests', expect.objectContaining({
      organization: 'acme',
      repositoryId: 'repo-a',
    }));
    expect(result).toEqual([{ id: 1, title: 'PR', reviewers: [] }]);
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
