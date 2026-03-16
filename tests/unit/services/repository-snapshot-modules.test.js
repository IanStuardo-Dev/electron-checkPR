jest.mock('../../../src/services/github/github.api', () => ({
  getGitHubConfig: jest.fn((config) => ({
    organization: config.organization,
    personalAccessToken: config.personalAccessToken,
    repository: config.repositoryId,
  })),
  requestGitHubJson: jest.fn(),
  requestGitHubContent: jest.fn(),
}));

jest.mock('../../../src/services/azure/azure.api', () => ({
  AZURE_API_VERSION: '7.1',
  getAzureConfig: jest.fn((config) => config),
  requestAzureJson: jest.fn(),
  requestAzureText: jest.fn(),
}));

jest.mock('../../../src/services/gitlab/gitlab.api', () => ({
  GITLAB_API_BASE_URL: 'https://gitlab.example/api/v4',
  getGitLabConfig: jest.fn((config) => ({
    project: config.repositoryId || config.project,
    personalAccessToken: config.personalAccessToken,
  })),
  requestGitLabJson: jest.fn(),
  requestPaginatedGitLabTree: jest.fn(),
}));

const githubApi = require('../../../src/services/github/github.api');
const azureApi = require('../../../src/services/azure/azure.api');
const gitlabApi = require('../../../src/services/gitlab/gitlab.api');
const githubSnapshot = require('../../../src/services/github/github.snapshot');
const { getAzureRepositorySnapshot } = require('../../../src/services/azure/azure.snapshot');
const { getGitLabRepositorySnapshot } = require('../../../src/services/gitlab/gitlab.snapshot');

describe('repository snapshot modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('enumerateGitHubContents corta temprano al alcanzar inventoryTarget', async () => {
    githubApi.requestGitHubContent
      .mockResolvedValueOnce([
        { type: 'dir', path: 'src' },
        { type: 'file', path: 'README.md', size: 10 },
      ])
      .mockResolvedValueOnce([
        { type: 'file', path: 'src/a.ts', size: 10 },
        { type: 'file', path: 'src/b.ts', size: 10 },
      ]);

    const result = await githubSnapshot.enumerateGitHubContents('acme', 'repo-a', 'main', 'pat', {
      inventoryTarget: 2,
      concurrency: 2,
    });

    expect(result.reachedInventoryTarget).toBe(true);
    expect(result.files.length).toBeGreaterThanOrEqual(2);
  });

  test('enumerateGitHubContents no consulta si inventoryTarget ya esta agotado', async () => {
    const result = await githubSnapshot.enumerateGitHubContents('acme', 'repo-a', 'main', 'pat', {
      inventoryTarget: 0,
      concurrency: 2,
    });

    expect(result).toEqual({ files: [], reachedInventoryTarget: true });
    expect(githubApi.requestGitHubContent).not.toHaveBeenCalled();
  });

  test('getGitHubRepositorySnapshot omite archivos grandes y binarios', async () => {
    githubApi.requestGitHubJson.mockResolvedValue({
      tree: [
        { type: 'blob', path: 'src/a.ts', size: 400000 },
        { type: 'blob', path: 'src/b.ts', size: 20 },
      ],
      truncated: false,
    });
    githubApi.requestGitHubContent.mockResolvedValueOnce({
      type: 'file',
      size: 20,
      encoding: 'base64',
      content: Buffer.from('\u0000\u0001binary').toString('base64'),
    });

    const snapshot = await githubSnapshot.getGitHubRepositorySnapshot({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    });

    expect(snapshot.truncated).toBe(true);
    expect(snapshot.exclusions.omittedBySize).toContain('src/a.ts');
    expect(snapshot.exclusions.omittedByBinaryDetection).toContain('src/b.ts');
  });

  test('getGitHubRepositorySnapshot recompone inventario cuando el tree viene truncado', async () => {
    githubApi.requestGitHubJson.mockResolvedValue({
      tree: [],
      truncated: true,
    });
    githubApi.requestGitHubContent
      .mockResolvedValueOnce([
        { type: 'file', path: 'src/a.ts', size: 20 },
      ])
      .mockResolvedValueOnce({
        type: 'file',
        size: 20,
        encoding: 'utf8',
        content: 'export const a = true;',
      });

    const snapshot = await githubSnapshot.getGitHubRepositorySnapshot({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    });

    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.partialReason).toMatch(/GitHub reporto el tree como truncado/i);
  });

  test('getGitHubRepositorySnapshot rechaza config incompleta y contabiliza retries de contenido', async () => {
    await expect(githubSnapshot.getGitHubRepositorySnapshot({
      organization: '',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    })).rejects.toThrow('Owner/organization, repository y token son obligatorios para GitHub.');

    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 0;
    });
    githubApi.requestGitHubJson.mockResolvedValue({
      tree: [
        { type: 'blob', path: 'src/a.ts', size: 20 },
      ],
      truncated: false,
    });
    githubApi.requestGitHubContent
      .mockRejectedValueOnce(new Error('GitHub content request failed (500): boom'))
      .mockResolvedValueOnce({
        type: 'file',
        size: 20,
        encoding: 'utf8',
        content: 'export const ok = true;',
      });

    const snapshot = await githubSnapshot.getGitHubRepositorySnapshot({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    });

    expect(snapshot.metrics.retryCount).toBe(1);
  });

  test('getGitHubRepositorySnapshot prioriza por tamano cuando el ranking del path empata', async () => {
    githubApi.requestGitHubJson.mockResolvedValue({
      tree: [
        { type: 'blob', path: 'src/large.ts', size: 50 },
        { type: 'blob', path: 'src/small.ts', size: 10 },
      ],
      truncated: false,
    });
    githubApi.requestGitHubContent.mockResolvedValue({
      type: 'file',
      size: 10,
      encoding: 'utf8',
      content: 'export const ok = true;',
    });

    const snapshot = await githubSnapshot.getGitHubRepositorySnapshot({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    });

    expect(snapshot.files).toEqual([
      expect.objectContaining({ path: 'src/small.ts' }),
    ]);
  });

  test('getGitHubRepositorySnapshot prioriza primero paths de mayor riesgo aunque pesen mas', async () => {
    githubApi.requestGitHubJson.mockResolvedValue({
      tree: [
        { type: 'blob', path: 'src/core.ts', size: 10 },
        { type: 'blob', path: 'src/auth.ts', size: 50 },
      ],
      truncated: false,
    });
    githubApi.requestGitHubContent.mockResolvedValue({
      type: 'file',
      size: 50,
      encoding: 'utf8',
      content: 'export const ok = true;',
    });

    const snapshot = await githubSnapshot.getGitHubRepositorySnapshot({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    });

    expect(snapshot.files).toEqual([
      expect.objectContaining({ path: 'src/auth.ts' }),
    ]);
  });

  test('getGitHubRepositorySnapshot falla si un archivo devuelve payload de directorio', async () => {
    githubApi.requestGitHubJson.mockResolvedValue({
      tree: [
        { type: 'blob', path: 'src/a.ts', size: 20 },
      ],
      truncated: false,
    });
    githubApi.requestGitHubContent.mockResolvedValue([]);

    await expect(githubSnapshot.getGitHubRepositorySnapshot({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    })).rejects.toThrow('returned a directory payload unexpectedly');
  });

  test('getAzureRepositorySnapshot omite tamano excesivo y binario', async () => {
    azureApi.requestAzureJson.mockResolvedValue({
      value: [
        { path: '/src/bin.ts', isFolder: false },
        { path: '/src/large.ts', isFolder: false },
      ],
    });
    azureApi.requestAzureText
      .mockResolvedValueOnce('\u0000\u0001binary')
      .mockResolvedValueOnce('x'.repeat(400000));

    const snapshot = await getAzureRepositorySnapshot({
      organization: 'org',
      project: 'proj',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    });

    expect(snapshot.truncated).toBe(true);
    expect(snapshot.exclusions.omittedBySize).toContain('src/large.ts');
    expect(snapshot.exclusions.omittedByBinaryDetection).toContain('src/bin.ts');
  });

  test('getAzureRepositorySnapshot recorta archivos priorizados y normaliza paths', async () => {
    azureApi.requestAzureJson.mockResolvedValue({
      value: [
        { path: '/src/a.ts', isFolder: false },
        { path: '/src/b.ts', isFolder: false },
      ],
    });
    azureApi.requestAzureText.mockResolvedValue('export const ok = true;');

    const snapshot = await getAzureRepositorySnapshot({
      organization: 'org',
      project: 'proj',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    });

    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/a.ts');
    expect(snapshot.partialReason).toMatch(/se recorto a 1 archivos priorizados/i);
  });

  test('getGitLabRepositorySnapshot omite tamano excesivo y binario', async () => {
    gitlabApi.requestPaginatedGitLabTree.mockResolvedValue([
      { path: 'src/bin.ts', type: 'blob' },
      { path: 'src/large.ts', type: 'blob' },
    ]);
    gitlabApi.requestGitLabJson
      .mockResolvedValueOnce({
        file_path: 'src/bin.ts',
        size: 20,
        content: Buffer.from('\u0000\u0001binary').toString('base64'),
        encoding: 'base64',
      })
      .mockResolvedValueOnce({
        file_path: 'src/large.ts',
        size: 400000,
        content: Buffer.from('x'.repeat(100)).toString('base64'),
        encoding: 'base64',
      });

    const snapshot = await getGitLabRepositorySnapshot({
      project: 'group/repo-a',
      repositoryId: 'group/repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 5,
      includeTests: false,
    });

    expect(snapshot.truncated).toBe(true);
    expect(snapshot.exclusions.omittedBySize).toContain('src/large.ts');
    expect(snapshot.exclusions.omittedByBinaryDetection).toContain('src/bin.ts');
  });

  test('getGitLabRepositorySnapshot soporta contenido no base64 y partialReason por recorte', async () => {
    gitlabApi.requestPaginatedGitLabTree.mockResolvedValue([
      { path: 'src/a.ts', type: 'blob' },
      { path: 'src/b.ts', type: 'blob' },
    ]);
    gitlabApi.requestGitLabJson.mockResolvedValue({
      file_path: 'src/a.ts',
      size: 22,
      content: 'export const ok = true;',
      encoding: 'text',
    });

    const snapshot = await getGitLabRepositorySnapshot({
      project: 'group/repo-a',
      repositoryId: 'group/repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    });

    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/a.ts');
    expect(snapshot.partialReason).toMatch(/se recorto a 1 archivos priorizados/i);
  });

  test('getGitLabRepositorySnapshot rechaza config incompleta y contabiliza retries', async () => {
    await expect(getGitLabRepositorySnapshot({
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    })).rejects.toThrow('Proyecto y token son obligatorios para GitLab.');

    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 0;
    });
    gitlabApi.requestPaginatedGitLabTree.mockResolvedValue([
      { path: 'src/a.ts', type: 'blob' },
    ]);
    gitlabApi.requestGitLabJson
      .mockRejectedValueOnce(new Error('GitLab file request failed (500): boom'))
      .mockResolvedValueOnce({
        file_path: 'src/a.ts',
        size: 22,
        content: 'export const ok = true;',
        encoding: 'text',
      });

    const snapshot = await getGitLabRepositorySnapshot({
      project: 'group/repo-a',
      repositoryId: 'group/repo-a',
      personalAccessToken: 'pat',
    }, {
      branchName: 'main',
      maxFiles: 1,
      includeTests: false,
    });

    expect(snapshot.metrics.retryCount).toBe(1);
  });
});
