const githubApi = require('../../../src/services/github/github.api');

describe('github api helpers', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('getGitHubConfig normaliza owner, token y repositorio', () => {
    expect(githubApi.getGitHubConfig({
      organization: 'https://github.com/IanStuardo-Dev/',
      project: '/electron-checkPR/',
      repositoryId: '',
      personalAccessToken: ' token ',
    })).toEqual({
      organization: 'IanStuardo-Dev',
      personalAccessToken: 'token',
      repository: 'electron-checkPR',
    });
  });

  test('getGitHubNextPage devuelve la siguiente pagina cuando existe link header', () => {
    expect(githubApi.getGitHubNextPage(new Headers({
      link: '<https://api.github.com/page/2>; rel="next", <https://api.github.com/page/4>; rel="last"',
    }))).toBe('https://api.github.com/page/2');

    expect(githubApi.getGitHubNextPage(new Headers())).toBeNull();
  });

  test('readGitHubResponse propaga el hint de forbidden', async () => {
    await expect(githubApi.readGitHubResponse(new Response('Forbidden', {
      status: 403,
      headers: { 'content-type': 'text/plain' },
    }), 'projects request')).rejects.toThrow('Revisa scopes del token.');
  });

  test('requestGitHubPaginated recorre paginas y requestGitHubContent usa headers correctos', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          link: '<https://api.github.com/page/2>; rel="next"',
        },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 2 }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        type: 'file',
        path: 'src/app.ts',
        size: 20,
        content: 'export const ok = true;',
        encoding: 'utf8',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));

    const items = await githubApi.requestGitHubPaginated('https://api.github.com/page/1', 'pat', 'projects request');
    const content = await githubApi.requestGitHubContent('https://api.github.com/repos/acme/repo/contents/src/app.ts', 'pat', 'content request');

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(content).toEqual(expect.objectContaining({ type: 'file', path: 'src/app.ts' }));
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://api.github.com/page/1', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer pat',
        'X-GitHub-Api-Version': '2022-11-28',
      }),
    }));
  });
});
