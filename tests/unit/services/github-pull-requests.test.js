jest.mock('../../../src/services/github/github.api', () => ({
  getGitHubConfig: jest.fn((config) => ({
    organization: config.organization,
    personalAccessToken: config.personalAccessToken,
    repository: config.repositoryId || config.project || '',
  })),
  requestGitHubJson: jest.fn(),
  requestGitHubPaginated: jest.fn(),
}));

jest.mock('../../../src/services/github/github.repositories', () => ({
  getGitHubRepositories: jest.fn(),
}));

const githubApi = require('../../../src/services/github/github.api');
const { getGitHubRepositories } = require('../../../src/services/github/github.repositories');
const { getGitHubPullRequests } = require('../../../src/services/github/github.pull-requests');

describe('github pull requests module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('usa repositorio directo cuando viene configurado y consolida reviewers sin duplicados', async () => {
    githubApi.requestGitHubPaginated.mockResolvedValue([
      {
        number: 10,
        title: 'Improve auth',
        body: '',
        state: 'open',
        created_at: '2026-03-11T10:00:00.000Z',
        html_url: 'https://github.com/acme/repo-a/pull/10',
        draft: false,
        user: {},
        requested_reviewers: [{ login: 'ana' }],
        assignees: [{ login: 'ana' }, { login: 'luis' }],
        head: { ref: 'feature/auth' },
        base: { ref: 'main' },
      },
    ]);
    githubApi.requestGitHubJson.mockResolvedValue([
      { user: { login: 'ana' }, state: 'CHANGES_REQUESTED' },
      { user: { login: 'reviewer-2' }, state: 'COMMENTED' },
    ]);

    const pullRequests = await getGitHubPullRequests({
      organization: 'acme',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    });

    expect(getGitHubRepositories).not.toHaveBeenCalled();
    expect(pullRequests).toEqual([
      expect.objectContaining({
        id: 10,
        description: 'No description provided.',
        createdBy: expect.objectContaining({
          displayName: 'Unknown author',
        }),
        reviewers: [
          { displayName: 'ana', uniqueName: 'ana', vote: -10, isRequired: true },
          { displayName: 'reviewer-2', uniqueName: 'reviewer-2', vote: 0, isRequired: false },
          { displayName: 'luis', uniqueName: 'luis', vote: 0, isRequired: false },
        ],
      }),
    ]);
  });

  test('si no hay repository configurado obtiene repositorios y ordena por fecha', async () => {
    getGitHubRepositories.mockResolvedValue([
      { id: 'repo-a', name: 'repo-a' },
      { id: 'repo-b', name: 'repo-b' },
    ]);
    githubApi.requestGitHubPaginated
      .mockResolvedValueOnce([
        {
          number: 1,
          title: 'Older PR',
          body: 'body',
          state: 'open',
          created_at: '2026-03-10T10:00:00.000Z',
          html_url: 'https://github.com/acme/repo-a/pull/1',
          draft: false,
          user: { login: 'ian' },
          requested_reviewers: [],
          assignees: [],
          head: { ref: 'feature/a' },
          base: { ref: 'main' },
        },
      ])
      .mockResolvedValueOnce([
        {
          number: 2,
          title: 'Newest PR',
          body: 'body',
          state: 'open',
          created_at: '2026-03-12T10:00:00.000Z',
          html_url: 'https://github.com/acme/repo-b/pull/2',
          draft: false,
          user: { login: 'ian' },
          requested_reviewers: [],
          assignees: [],
          head: { ref: 'feature/b' },
          base: { ref: 'main' },
        },
      ]);
    githubApi.requestGitHubJson.mockResolvedValue([]);

    const pullRequests = await getGitHubPullRequests({
      organization: 'acme',
      personalAccessToken: 'pat',
    });

    expect(getGitHubRepositories).toHaveBeenCalled();
    expect(pullRequests.map((item) => item.id)).toEqual([2, 1]);
  });

  test('rechaza configuracion incompleta', async () => {
    await expect(getGitHubPullRequests({
      organization: '',
      personalAccessToken: 'pat',
    })).rejects.toThrow('Owner/organization y token son obligatorios para GitHub.');
  });
});
