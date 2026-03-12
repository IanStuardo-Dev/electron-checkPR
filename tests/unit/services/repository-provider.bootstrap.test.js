const bootstrap = require('../../../src/services/providers/repository-provider.bootstrap');
const { pullRequestService } = require('../../../src/services/azure/pr.service');

describe('repository provider bootstrap', () => {
  test('construye los providers por defecto sin depender de estado global', () => {
    const providers = bootstrap.buildDefaultRepositoryProviderPorts();

    expect(providers).toHaveLength(3);
    expect(providers.map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });

  test('cada provider port expone las funciones del servicio subyacente', () => {
    const [azureProvider] = bootstrap.buildDefaultRepositoryProviderPorts();

    expect(typeof azureProvider.getProjects).toBe('function');
    expect(typeof azureProvider.getRepositories).toBe('function');
    expect(typeof azureProvider.getBranches).toBe('function');
    expect(typeof azureProvider.getPullRequests).toBe('function');
    expect(typeof azureProvider.getPullRequestSnapshot).toBe('function');
    expect(typeof azureProvider.getRepositorySnapshot).toBe('function');
  });

  test('el provider delega las llamadas al servicio concreto', async () => {
    const [azureProvider] = bootstrap.buildDefaultRepositoryProviderPorts();
    jest.spyOn(pullRequestService, 'getProjects').mockResolvedValueOnce([{ id: '1', name: 'Core' }]);
    jest.spyOn(pullRequestService, 'getRepositories').mockResolvedValueOnce([{ id: 'repo', name: 'repo' }]);
    jest.spyOn(pullRequestService, 'getBranches').mockResolvedValueOnce([{ name: 'main', objectId: '1', isDefault: true }]);
    jest.spyOn(pullRequestService, 'getPullRequests').mockResolvedValueOnce([{ id: 1 }]);
    jest.spyOn(pullRequestService, 'getPullRequestSnapshot').mockResolvedValueOnce({ repository: 'repo' });
    jest.spyOn(pullRequestService, 'getRepositorySnapshot').mockResolvedValueOnce({ repository: 'repo', branch: 'main' });

    const config = { provider: 'azure-devops', organization: 'org', project: 'proj', repositoryId: 'repo', personalAccessToken: 'pat' };
    const pr = { id: 1 };

    await expect(azureProvider.getProjects(config)).resolves.toEqual([{ id: '1', name: 'Core' }]);
    await expect(azureProvider.getRepositories(config)).resolves.toEqual([{ id: 'repo', name: 'repo' }]);
    await expect(azureProvider.getBranches(config)).resolves.toEqual([{ name: 'main', objectId: '1', isDefault: true }]);
    await expect(azureProvider.getPullRequests(config)).resolves.toEqual([{ id: 1 }]);
    await expect(azureProvider.getPullRequestSnapshot(config, pr, { excludedPathPatterns: '' })).resolves.toEqual({ repository: 'repo' });
    await expect(azureProvider.getRepositorySnapshot(config, { branchName: 'main', maxFiles: 5, includeTests: false })).resolves.toEqual({ repository: 'repo', branch: 'main' });
  });
});
