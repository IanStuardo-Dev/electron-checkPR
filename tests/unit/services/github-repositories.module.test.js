jest.mock('../../../src/services/github/github.api', () => ({
  getGitHubConfig: jest.fn(),
  requestGitHubJson: jest.fn(),
  requestGitHubPaginated: jest.fn(),
}));

const githubApi = require('../../../src/services/github/github.api');
const {
  getGitHubRepositories,
  getGitHubProjects,
  getGitHubBranches,
} = require('../../../src/services/github/github.repositories');

describe('github.repositories module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getGitHubRepositories exige owner y token', async () => {
    githubApi.getGitHubConfig.mockReturnValue({
      organization: '',
      repository: '',
      personalAccessToken: '',
    });

    await expect(getGitHubRepositories({
      provider: 'github',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
    })).rejects.toThrow('Owner/organization y token son obligatorios para GitHub.');
  });

  test('getGitHubProjects transforma repositorios en proyectos activos', async () => {
    githubApi.getGitHubConfig.mockReturnValue({
      organization: 'acme',
      repository: '',
      personalAccessToken: 'pat',
    });
    githubApi.requestGitHubPaginated.mockResolvedValue([
      {
        name: 'repo-a',
        html_url: 'https://github.com/acme/repo-a',
        default_branch: 'main',
        owner: { login: 'acme' },
      },
    ]);

    await expect(getGitHubProjects({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
    })).resolves.toEqual([
      { id: 'repo-a', name: 'repo-a', state: 'active' },
    ]);
  });

  test('getGitHubBranches exige repository ademas de owner y token', async () => {
    githubApi.getGitHubConfig.mockReturnValue({
      organization: 'acme',
      repository: '',
      personalAccessToken: 'pat',
    });

    await expect(getGitHubBranches({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
    })).rejects.toThrow('Owner/organization, repository y token son obligatorios para GitHub.');
  });

  test('getGitHubBranches marca la rama default usando detalles del repo', async () => {
    githubApi.getGitHubConfig.mockReturnValue({
      organization: 'acme',
      repository: 'repo-a',
      personalAccessToken: 'pat',
    });
    githubApi.requestGitHubJson.mockResolvedValueOnce({ default_branch: 'main' });
    githubApi.requestGitHubPaginated.mockResolvedValue([
      { name: 'main', commit: { sha: 'sha-main' } },
      { name: 'develop', commit: { sha: 'sha-dev' } },
    ]);

    const branches = await getGitHubBranches({
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    });

    expect(branches).toEqual([
      { name: 'main', objectId: 'sha-main', isDefault: true },
      { name: 'develop', objectId: 'sha-dev', isDefault: false },
    ]);
    expect(githubApi.requestGitHubPaginated).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme/repo-a/branches?per_page=100',
      'pat',
      'branches request',
    );
  });
});
