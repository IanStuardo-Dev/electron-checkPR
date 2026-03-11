const { PullRequestService } = require('../src/services/azure/pr.service');

describe('Azure snapshot retries', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reintenta descarga de contenido cuando Azure responde 429', async () => {
    const service = new PullRequestService();
    let contentAttempts = 0;
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      if (typeof callback === 'function') {
        callback();
      }

      return 0;
    });

    global.fetch = jest.fn((url) => {
      if (url.includes('includeContentMetadata=true')) {
        return Promise.resolve(new Response(JSON.stringify({
          value: [
            { path: '/src/app.ts', isFolder: false },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('path=%2Fsrc%2Fapp.ts')) {
        contentAttempts += 1;
        if (contentAttempts === 1) {
          return Promise.resolve(new Response('Too Many Requests', {
            status: 429,
            headers: { 'content-type': 'text/plain' },
          }));
        }

        return Promise.resolve(new Response('export const app = true;', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }));
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const snapshot = await service.getRepositorySnapshot({
      provider: 'azure-devops',
      organization: 'org',
      project: 'proj',
      repositoryId: 'repo',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 10,
      includeTests: false,
    });

    expect(contentAttempts).toBe(2);
    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/app.ts');
  });
});
