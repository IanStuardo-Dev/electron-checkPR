const {
  composeRepositoryProviderPort,
  createPullRequestSnapshotCapabilityAdapter,
  createRepositorySnapshotCapabilityAdapter,
  createRepositorySourceCapabilityAdapter,
} = require('../../../src/services/providers/repository-provider.capability-composition');

function createProviderService() {
  return {
    getProjects: jest.fn().mockResolvedValue([{ id: 'p1' }]),
    getRepositories: jest.fn().mockResolvedValue([{ id: 'r1' }]),
    getBranches: jest.fn().mockResolvedValue([{ name: 'main' }]),
    getPullRequests: jest.fn().mockResolvedValue([{ id: 1 }]),
    getPullRequestSnapshot: jest.fn().mockResolvedValue({ pullRequestId: 1 }),
    getRepositorySnapshot: jest.fn().mockResolvedValue({ repository: 'repo-a' }),
  };
}

describe('repository provider capability composition', () => {
  test('compone un provider por capacidades manteniendo el contrato completo', async () => {
    const providerService = createProviderService();
    const provider = composeRepositoryProviderPort('github', {
      source: createRepositorySourceCapabilityAdapter(providerService),
      pullRequestSnapshots: createPullRequestSnapshotCapabilityAdapter(providerService),
      repositorySnapshots: createRepositorySnapshotCapabilityAdapter(providerService),
    });

    const config = {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    };

    await provider.getProjects(config);
    await provider.getRepositories(config);
    await provider.getBranches(config);
    await provider.getPullRequests(config);
    await provider.getPullRequestSnapshot(config, { id: 1 }, { excludedPathPatterns: '' });
    await provider.getRepositorySnapshot(config, { branchName: 'main', maxFiles: 20, includeTests: false });

    expect(provider.kind).toBe('github');
    expect(providerService.getProjects).toHaveBeenCalledWith(config);
    expect(providerService.getRepositories).toHaveBeenCalledWith(config);
    expect(providerService.getBranches).toHaveBeenCalledWith(config);
    expect(providerService.getPullRequests).toHaveBeenCalledWith(config);
    expect(providerService.getPullRequestSnapshot).toHaveBeenCalled();
    expect(providerService.getRepositorySnapshot).toHaveBeenCalled();
  });
});
