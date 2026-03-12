jest.mock('../../../src/services/github/github.api', () => ({
  getGitHubConfig: jest.fn((config) => ({
    organization: config.organization,
    personalAccessToken: config.personalAccessToken,
  })),
  requestGitHubPaginated: jest.fn(),
}));

jest.mock('../../../src/services/azure/azure.api', () => ({
  AZURE_API_VERSION: '7.1',
  getAzureConfig: jest.fn((config) => config),
  requestAzureJson: jest.fn(),
}));

jest.mock('../../../src/services/gitlab/gitlab.api', () => ({
  GITLAB_API_BASE_URL: 'https://gitlab.example/api/v4',
  getGitLabConfig: jest.fn((config) => ({
    project: config.project,
    personalAccessToken: config.personalAccessToken,
  })),
  requestGitLabJson: jest.fn(),
}));

const { requestGitHubPaginated } = require('../../../src/services/github/github.api');
const { requestAzureJson } = require('../../../src/services/azure/azure.api');
const { requestGitLabJson } = require('../../../src/services/gitlab/gitlab.api');
const { getGitHubPullRequestSnapshot } = require('../../../src/services/github/github.pr-snapshot');
const { getAzurePullRequestSnapshot } = require('../../../src/services/azure/azure.pr-snapshot');
const { getGitLabPullRequestSnapshot } = require('../../../src/services/gitlab/gitlab.pr-snapshot');

const basePullRequest = {
  id: 7,
  title: 'Actualizar auth',
  description: 'Cambio importante',
  repository: 'repo-a',
  createdBy: { displayName: 'Ian' },
  sourceBranch: 'feature/auth',
  targetBranch: 'main',
  reviewers: [{ displayName: 'Ana', vote: 10, isRequired: true }],
};

describe('provider PR snapshots', () => {
  beforeEach(() => {
    requestGitHubPaginated.mockReset();
    requestAzureJson.mockReset();
    requestGitLabJson.mockReset();
  });

  test('github snapshot excluye paths y reporta archivos sin patch', async () => {
    requestGitHubPaginated.mockResolvedValue([
      { filename: '.env', status: 'modified', additions: 1, deletions: 0, patch: '+SECRET=1' },
      { filename: 'src/auth.ts', status: 'modified', additions: 2, deletions: 1 },
    ]);

    const snapshot = await getGitHubPullRequestSnapshot(
      { organization: 'acme', personalAccessToken: 'pat' },
      basePullRequest,
      { excludedPathPatterns: '.env' },
    );

    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/auth.ts');
    expect(snapshot.partialReason).toMatch(/Se excluyeron 1 archivos/i);
    expect(snapshot.partialReason).toMatch(/no incluyen patch textual/i);
  });

  test('azure snapshot usa iteracion activa y agrega nota sin patch', async () => {
    requestAzureJson
      .mockResolvedValueOnce({ value: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce({
        changeEntries: [
          { item: { path: '/.env' }, changeType: 'edit' },
          { item: { path: '/src/auth.ts' }, changeType: 'edit' },
        ],
      });

    const snapshot = await getAzurePullRequestSnapshot(
      { organization: 'acme', project: 'repo-a', personalAccessToken: 'pat', repositoryId: 'repo-a' },
      basePullRequest,
      { excludedPathPatterns: '.env' },
    );

    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/auth.ts');
    expect(snapshot.partialReason).toMatch(/Se excluyeron 1 archivos/i);
    expect(snapshot.partialReason).toMatch(/Azure DevOps no entrego patch textual/i);
  });

  test('gitlab snapshot marca diffs ausentes y respeta exclusiones', async () => {
    requestGitLabJson.mockResolvedValue({
      changes: [
        { new_path: '.env', old_path: '.env', diff: '+SECRET=1', new_file: false, deleted_file: false, renamed_file: false },
        { new_path: 'src/auth.ts', old_path: 'src/auth.ts', diff: '', new_file: false, deleted_file: false, renamed_file: false },
      ],
    });

    const snapshot = await getGitLabPullRequestSnapshot(
      { project: 'group/repo-a', personalAccessToken: 'pat' },
      basePullRequest,
      { excludedPathPatterns: '.env' },
    );

    expect(snapshot.files).toHaveLength(1);
    expect(snapshot.files[0].path).toBe('src/auth.ts');
    expect(snapshot.partialReason).toMatch(/Se excluyeron 1 archivos/i);
    expect(snapshot.partialReason).toMatch(/no incluyen diff textual/i);
  });
});
