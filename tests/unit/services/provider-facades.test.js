jest.mock('../../../src/services/azure/azure.repositories', () => ({
  getAzureProjects: jest.fn(),
  getAzureRepositories: jest.fn(),
  getAzureBranches: jest.fn(),
}));

jest.mock('../../../src/services/azure/azure.pull-requests', () => ({
  getAzurePullRequests: jest.fn(),
}));

jest.mock('../../../src/services/azure/azure.snapshot', () => ({
  getAzureRepositorySnapshot: jest.fn(),
}));

jest.mock('../../../src/services/github/github.repositories', () => ({
  getGitHubProjects: jest.fn(),
  getGitHubRepositories: jest.fn(),
  getGitHubBranches: jest.fn(),
}));

jest.mock('../../../src/services/github/github.pull-requests', () => ({
  getGitHubPullRequests: jest.fn(),
}));

jest.mock('../../../src/services/github/github.snapshot', () => ({
  enumerateGitHubContents: jest.fn(),
  getGitHubRepositorySnapshot: jest.fn(),
}));

jest.mock('../../../src/services/gitlab/gitlab.repositories', () => ({
  getGitLabProjects: jest.fn(),
  getGitLabRepositories: jest.fn(),
  getGitLabBranches: jest.fn(),
}));

jest.mock('../../../src/services/gitlab/gitlab.pull-requests', () => ({
  getGitLabPullRequests: jest.fn(),
}));

jest.mock('../../../src/services/gitlab/gitlab.snapshot', () => ({
  getGitLabRepositorySnapshot: jest.fn(),
}));

const azureRepositories = require('../../../src/services/azure/azure.repositories');
const azurePullRequests = require('../../../src/services/azure/azure.pull-requests');
const azureSnapshot = require('../../../src/services/azure/azure.snapshot');
const githubRepositories = require('../../../src/services/github/github.repositories');
const githubPullRequests = require('../../../src/services/github/github.pull-requests');
const githubSnapshot = require('../../../src/services/github/github.snapshot');
const gitlabRepositories = require('../../../src/services/gitlab/gitlab.repositories');
const gitlabPullRequests = require('../../../src/services/gitlab/gitlab.pull-requests');
const gitlabSnapshot = require('../../../src/services/gitlab/gitlab.snapshot');
const { PullRequestService } = require('../../../src/services/azure/pr.service');
const { GitHubRepositoryService } = require('../../../src/services/github/repository.service');
const { GitLabRepositoryService } = require('../../../src/services/gitlab/repository.service');

describe('provider facades', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PullRequestService delega proyectos, repos, ramas, PRs y snapshot', async () => {
    azureRepositories.getAzureProjects.mockResolvedValue([{ id: '1', name: 'Core', state: 'active' }]);
    azureRepositories.getAzureRepositories.mockResolvedValue([{ id: 'repo-a', name: 'repo-a' }]);
    azureRepositories.getAzureBranches.mockResolvedValue([{ name: 'main', objectId: '1', isDefault: true }]);
    azurePullRequests.getAzurePullRequests.mockResolvedValue([{ id: 1, title: 'PR' }]);
    azureSnapshot.getAzureRepositorySnapshot.mockResolvedValue({ repository: 'repo-a', branch: 'main', files: [], totalFilesDiscovered: 0, truncated: false });

    const service = new PullRequestService();
    const config = { provider: 'azure-devops', organization: 'org-a', project: 'Core', repositoryId: 'repo-a', personalAccessToken: 'pat' };

    await expect(service.getProjects(config)).resolves.toEqual([{ id: '1', name: 'Core', state: 'active' }]);
    await expect(service.getRepositories(config)).resolves.toEqual([{ id: 'repo-a', name: 'repo-a' }]);
    await expect(service.getBranches(config)).resolves.toEqual([{ name: 'main', objectId: '1', isDefault: true }]);
    await expect(service.getPullRequests(config)).resolves.toEqual([{ id: 1, title: 'PR' }]);
    await expect(service.getRepositorySnapshot(config, { branchName: 'main', maxFiles: 10, includeTests: false })).resolves.toMatchObject({ repository: 'repo-a' });
  });

  test('GitHubRepositoryService delega en sus modulos especializados', async () => {
    githubRepositories.getGitHubProjects.mockResolvedValue([{ id: 'repo-a', name: 'repo-a', state: 'active' }]);
    githubRepositories.getGitHubRepositories.mockResolvedValue([{ id: 'repo-a', name: 'repo-a' }]);
    githubRepositories.getGitHubBranches.mockResolvedValue([{ name: 'main', objectId: 'sha-main', isDefault: true }]);
    githubPullRequests.getGitHubPullRequests.mockResolvedValue([{ id: 7, title: 'PR' }]);
    githubSnapshot.getGitHubRepositorySnapshot.mockResolvedValue({ repository: 'repo-a', branch: 'main', files: [], totalFilesDiscovered: 0, truncated: false });

    const service = new GitHubRepositoryService();
    const config = { provider: 'github', organization: 'acme', project: 'repo-a', repositoryId: 'repo-a', personalAccessToken: 'pat' };

    await expect(service.getProjects(config)).resolves.toEqual([{ id: 'repo-a', name: 'repo-a', state: 'active' }]);
    await expect(service.getRepositories(config)).resolves.toEqual([{ id: 'repo-a', name: 'repo-a' }]);
    await expect(service.getBranches(config)).resolves.toEqual([{ name: 'main', objectId: 'sha-main', isDefault: true }]);
    await expect(service.getPullRequests(config)).resolves.toEqual([{ id: 7, title: 'PR' }]);
    await expect(service.getRepositorySnapshot(config, { branchName: 'main', maxFiles: 10, includeTests: false })).resolves.toMatchObject({ repository: 'repo-a' });
  });

  test('GitLabRepositoryService delega en sus modulos especializados', async () => {
    gitlabRepositories.getGitLabProjects.mockResolvedValue([{ id: 'acme/repo-a', name: 'repo-a', state: 'active' }]);
    gitlabRepositories.getGitLabRepositories.mockResolvedValue([{ id: 'acme/repo-a', name: 'repo-a' }]);
    gitlabRepositories.getGitLabBranches.mockResolvedValue([{ name: 'main', objectId: 'sha-main', isDefault: true }]);
    gitlabPullRequests.getGitLabPullRequests.mockResolvedValue([{ id: 11, title: 'MR' }]);
    gitlabSnapshot.getGitLabRepositorySnapshot.mockResolvedValue({ repository: 'repo-a', branch: 'main', files: [], totalFilesDiscovered: 0, truncated: false });

    const service = new GitLabRepositoryService();
    const config = { provider: 'gitlab', organization: 'acme', project: 'acme/repo-a', repositoryId: 'acme/repo-a', personalAccessToken: 'pat' };

    await expect(service.getProjects(config)).resolves.toEqual([{ id: 'acme/repo-a', name: 'repo-a', state: 'active' }]);
    await expect(service.getRepositories(config)).resolves.toEqual([{ id: 'acme/repo-a', name: 'repo-a' }]);
    await expect(service.getBranches(config)).resolves.toEqual([{ name: 'main', objectId: 'sha-main', isDefault: true }]);
    await expect(service.getPullRequests(config)).resolves.toEqual([{ id: 11, title: 'MR' }]);
    await expect(service.getRepositorySnapshot(config, { branchName: 'main', maxFiles: 10, includeTests: false })).resolves.toMatchObject({ repository: 'repo-a' });
  });
});
