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
});
