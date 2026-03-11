jest.mock('../../../src/services/gitlab/gitlab.api', () => ({
  GITLAB_API_BASE_URL: 'https://gitlab.com/api/v4',
  buildProject: jest.fn((project) => ({ id: project.path_with_namespace, name: project.name, state: 'active' })),
  buildRepository: jest.fn((project) => ({ id: project.path_with_namespace, name: project.name, webUrl: project.web_url })),
  getGitLabConfig: jest.fn((config) => config),
  normalizeNamespace: jest.fn((value) => value.toLowerCase()),
  requestGitLabJson: jest.fn(),
  requestGitLabPaginated: jest.fn(),
}));

const gitlabApi = require('../../../src/services/gitlab/gitlab.api');
const { getGitLabRepositories, getGitLabProjects, getGitLabBranches } = require('../../../src/services/gitlab/gitlab.repositories');
const { getGitLabPullRequests } = require('../../../src/services/gitlab/gitlab.pull-requests');

describe('gitlab modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getGitLabRepositories filtra por namespace y projects reusa repos', async () => {
    gitlabApi.requestGitLabPaginated.mockResolvedValue([
      { path_with_namespace: 'acme/repo-a', name: 'Repo A', web_url: 'https://gitlab.com/acme/repo-a' },
      { path_with_namespace: 'other/repo-b', name: 'Repo B', web_url: 'https://gitlab.com/other/repo-b' },
    ]);

    const repositories = await getGitLabRepositories({ organization: 'acme', personalAccessToken: 'pat' });
    const projects = await getGitLabProjects({ organization: 'acme', personalAccessToken: 'pat' });

    expect(repositories).toHaveLength(1);
    expect(projects[0].id).toBe('acme/repo-a');
  });

  test('getGitLabBranches mapea ramas', async () => {
    gitlabApi.requestGitLabJson.mockResolvedValue([
      { name: 'main', default: true, commit: { id: '1' } },
    ]);

    const branches = await getGitLabBranches({ project: 'acme/repo-a', personalAccessToken: 'pat' });

    expect(branches).toEqual([{ name: 'main', objectId: '1', isDefault: true }]);
  });

  test('getGitLabPullRequests agrega approvals, reviewers y assignees', async () => {
    gitlabApi.requestGitLabPaginated.mockResolvedValue([
      {
        iid: 10,
        title: 'MR',
        description: '',
        state: 'opened',
        created_at: '2026-03-11T10:00:00.000Z',
        source_branch: 'feature/x',
        target_branch: 'main',
        web_url: 'https://gitlab.com/acme/repo-a/-/merge_requests/10',
        draft: false,
        work_in_progress: false,
        detailed_merge_status: 'mergeable',
        author: { name: 'Ian', username: 'ian' },
        reviewers: [{ name: 'Ana', username: 'ana' }],
        assignees: [{ name: 'Luis', username: 'luis' }],
      },
    ]);
    gitlabApi.requestGitLabJson.mockResolvedValue({
      approved_by: [{ user: { name: 'Ana', username: 'ana' } }],
    });

    const prs = await getGitLabPullRequests({
      organization: 'acme',
      personalAccessToken: 'pat',
      project: 'acme/repo-a',
    });

    expect(prs).toHaveLength(1);
    expect(prs[0].reviewers).toEqual(expect.arrayContaining([
      expect.objectContaining({ uniqueName: 'ana', vote: 10, isRequired: true }),
      expect.objectContaining({ uniqueName: 'luis', vote: 0 }),
    ]));
  });
});
