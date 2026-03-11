const gitlabApi = require('../../../src/services/gitlab/gitlab.api');

describe('gitlab api helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getGitLabConfig normaliza namespace y proyecto', () => {
    expect(gitlabApi.getGitLabConfig({
      organization: 'https://gitlab.com/Acme/Platform/',
      project: '/acme/repo-a/',
      repositoryId: '',
      personalAccessToken: ' token ',
    })).toEqual({
      organization: 'Acme/Platform',
      project: 'acme/repo-a',
      personalAccessToken: 'token',
    });
  });

  test('readGitLabResponse valida errores y contenido inesperado', async () => {
    await expect(gitlabApi.readGitLabResponse(new Response('Forbidden', {
      status: 403,
      headers: { 'content-type': 'application/json' },
    }), 'projects request')).rejects.toThrow('forbidden');

    await expect(gitlabApi.readGitLabResponse(new Response('<html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }), 'projects request')).rejects.toThrow('unexpected content');
  });

  test('requestGitLabPaginated y requestPaginatedGitLabTree recorren paginas', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 2 }, (_, index) => index)), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify([2]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 100 }, (_, index) => ({ path: `src/${index}.ts`, type: 'blob' }))), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ path: 'src/final.ts', type: 'blob' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));

    const items = await gitlabApi.requestGitLabPaginated((page) => `https://gitlab.test/items?page=${page}`, 'pat', 'items request', 2);
    const tree = await gitlabApi.requestPaginatedGitLabTree('acme/repo-a', 'main', 'pat');

    expect(items).toEqual([0, 1, 2]);
    expect(tree).toHaveLength(101);
    expect(gitlabApi.buildProject({ path_with_namespace: 'acme/repo-a' })).toEqual({
      id: 'acme/repo-a',
      name: 'acme/repo-a',
      state: 'active',
    });
    expect(gitlabApi.buildRepository({ path_with_namespace: 'acme/repo-a', web_url: 'https://gitlab.com/acme/repo-a', default_branch: 'main' })).toEqual({
      id: 'acme/repo-a',
      name: 'acme/repo-a',
      webUrl: 'https://gitlab.com/acme/repo-a',
      defaultBranch: 'main',
    });
  });
});
