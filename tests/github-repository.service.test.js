const { GitHubRepositoryService, gitHubRepositoryServiceInternals } = require('../src/services/github/repository.service');

describe('GitHubRepositoryService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getRepositories filtra por owner configurado', async () => {
    const service = new GitHubRepositoryService();
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify([
        {
          id: 1,
          name: 'repo-a',
          html_url: 'https://github.com/acme/repo-a',
          default_branch: 'main',
          owner: { login: 'acme' },
        },
        {
          id: 2,
          name: 'repo-b',
          html_url: 'https://github.com/other/repo-b',
          default_branch: 'main',
          owner: { login: 'other' },
        },
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const repositories = await service.getRepositories({
      provider: 'github',
      organization: 'acme',
      project: '',
      personalAccessToken: 'token',
    });

    expect(repositories).toEqual([
      {
        id: 'repo-a',
        name: 'repo-a',
        webUrl: 'https://github.com/acme/repo-a',
        defaultBranch: 'main',
      },
    ]);
  });

  test('getPullRequests evita request de detalle por cada PR y mantiene reviewers', async () => {
    const service = new GitHubRepositoryService();
    global.fetch = jest.fn((url) => {
      if (url.includes('/pulls?state=open')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            number: 12,
            title: 'Fix auth flow',
            body: 'body',
            state: 'open',
            created_at: '2026-03-10T12:00:00.000Z',
            html_url: 'https://github.com/acme/repo-a/pull/12',
            draft: false,
            user: { login: 'ian', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
            requested_reviewers: [{ login: 'reviewer-1' }],
            assignees: [{ login: 'reviewer-2' }],
            head: { ref: 'feature/auth' },
            base: { ref: 'main' },
          },
        ]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('/reviews?per_page=100')) {
        return Promise.resolve(new Response(JSON.stringify([
          { user: { login: 'reviewer-1' }, state: 'APPROVED' },
        ]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const pullRequests = await service.getPullRequests({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'token',
    });

    expect(pullRequests).toHaveLength(1);
    expect(pullRequests[0]).toMatchObject({
      id: 12,
      repository: 'repo-a',
      mergeStatus: 'unknown',
    });
    expect(pullRequests[0].reviewers).toEqual([
      {
        displayName: 'reviewer-1',
        uniqueName: 'reviewer-1',
        vote: 10,
        isRequired: true,
      },
      {
        displayName: 'reviewer-2',
        uniqueName: 'reviewer-2',
        vote: 0,
        isRequired: false,
      },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const requestedUrls = global.fetch.mock.calls.map(([url]) => url);
    expect(requestedUrls).not.toContain('https://api.github.com/repos/acme/repo-a/pulls/12');
  });

  test('readGitHubResponse devuelve mensaje claro en 403', async () => {
    const response = new Response('Forbidden', {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });

    await expect(
      gitHubRepositoryServiceInternals.readGitHubResponse(response, 'repositories request'),
    ).rejects.toThrow('GitHub repositories request failed (403): forbidden. Revisa scopes del token. Response: Forbidden');
  });

  test('getRepositorySnapshot usa fallback por contents cuando el tree viene truncado', async () => {
    const service = new GitHubRepositoryService();
    global.fetch = jest.fn((url) => {
      if (url.includes('/git/trees/main?recursive=1')) {
        return Promise.resolve(new Response(JSON.stringify({
          tree: [{ path: 'src/ignored.ts', type: 'blob', sha: 'sha-1', size: 10 }],
          truncated: true,
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.endsWith('/contents?ref=main')) {
        return Promise.resolve(new Response(JSON.stringify([
          { type: 'dir', path: 'src', size: 0 },
          { type: 'dir', path: 'tests', size: 0 },
        ]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('/contents/src?ref=main')) {
        return Promise.resolve(new Response(JSON.stringify([
          { type: 'file', path: 'src/app.ts', size: 30 },
        ]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('/contents/tests?ref=main')) {
        return Promise.resolve(new Response(JSON.stringify([
          { type: 'file', path: 'tests/app.spec.ts', size: 20 },
        ]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('/contents/src/app.ts?ref=main')) {
        return Promise.resolve(new Response(JSON.stringify({
          type: 'file',
          path: 'src/app.ts',
          size: 30,
          content: Buffer.from('export const app = true;').toString('base64'),
          encoding: 'base64',
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const snapshot = await service.getRepositorySnapshot({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'token',
    }, {
      branchName: 'main',
      maxFiles: 10,
      includeTests: false,
    });

    expect(snapshot.totalFilesDiscovered).toBe(1);
    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/app.ts');
    expect(snapshot.partialReason).toContain('GitHub reporto el tree como truncado');
  });
});
