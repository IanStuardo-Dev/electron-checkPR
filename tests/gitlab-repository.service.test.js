const { GitLabRepositoryService } = require('../src/services/gitlab/repository.service');

describe('GitLabRepositoryService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('pagina el tree del repositorio antes de seleccionar archivos', async () => {
    const service = new GitLabRepositoryService();
    global.fetch = jest.fn((url) => {
      const requestUrl = new URL(url);
      const page = requestUrl.searchParams.get('page');

      if (url.includes('/repository/tree') && page === '1') {
        const page = Array.from({ length: 100 }, (_, index) => ({
          path: `src/file-${index}.ts`,
          type: 'blob',
        }));

        return Promise.resolve(new Response(JSON.stringify(page), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('/repository/tree') && page === '2') {
        return Promise.resolve(new Response(JSON.stringify([
          { path: 'src/file-100.ts', type: 'blob' },
          { path: 'tests/file.spec.ts', type: 'blob' },
        ]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      if (url.includes('/repository/files/')) {
        return Promise.resolve(new Response(JSON.stringify({
          file_path: 'src/file-0.ts',
          size: 20,
          content: Buffer.from('export const ok = true;').toString('base64'),
          encoding: 'base64',
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const snapshot = await service.getRepositorySnapshot({
      provider: 'gitlab',
      organization: 'acme',
      project: 'acme/repo-a',
      repositoryId: 'acme/repo-a',
      personalAccessToken: 'token',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    });

    expect(snapshot.totalFilesDiscovered).toBe(101);
    expect(snapshot.truncated).toBe(true);
    expect(snapshot.partialReason).toContain('1 archivos priorizados');
  });
});
