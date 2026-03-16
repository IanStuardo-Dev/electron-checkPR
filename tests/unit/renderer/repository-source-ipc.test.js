const repositorySourceIpc = require('../../../src/renderer/features/repository-source/data/repositorySourceIpc');

describe('repository source ipc gateway', () => {
  beforeEach(() => {
    global.window = {
      electronApi: {
        invoke: jest.fn(),
      },
      open: jest.fn(),
    };
    global.fetch = jest.fn();
  });

  test('resuelve canales genericos del gateway de repository source', () => {
    expect(repositorySourceIpc.getRepositorySourceChannel('pullRequests')).toBe('repository-source:fetchPullRequests');
    expect(repositorySourceIpc.getRepositorySourceChannel('repositories')).toBe('repository-source:fetchRepositories');
    expect(repositorySourceIpc.getRepositorySourceChannel('openExternal')).toBe('repository-source:openExternal');
  });

  test('fetchPullRequests usa electronApi.invoke y retorna data', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: true,
      data: [{ id: 1, title: 'PR', reviewers: [] }],
    });

    const result = await repositorySourceIpc.fetchPullRequests({
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
    await expect(repositorySourceIpc.fetchProjects({
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

    await expect(repositorySourceIpc.openReviewItem('https://github.com/acme/repo/pull/1', {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    })).rejects.toThrow('blocked');
  });

  test('fetchProjects usa fallback web para GitHub cuando no existe Electron', async () => {
    delete window.electronApi;

    fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn(() => 'application/json'),
      },
      text: jest.fn().mockResolvedValue(JSON.stringify([
        {
          name: 'electron-checkPR',
          html_url: 'https://github.com/IanStuardo-Dev/electron-checkPR',
          default_branch: 'main',
          owner: { login: 'IanStuardo-Dev' },
        },
      ])),
    });

    await expect(repositorySourceIpc.fetchProjects({
      provider: 'github',
      organization: 'IanStuardo-Dev',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    })).resolves.toEqual([
      {
        id: 'electron-checkPR',
        name: 'electron-checkPR',
        state: 'active',
      },
    ]);
  });

  test('openReviewItem usa window.open en web cuando no existe Electron', async () => {
    delete window.electronApi;

    await repositorySourceIpc.openReviewItem('https://github.com/acme/repo/pull/1', {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'secret',
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://github.com/acme/repo/pull/1',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
