const {
  RepositoryProviderRegistry,
} = require('../../../src/services/providers/repository-provider.registry');

describe('RepositoryProviderRegistry', () => {
  test('registra y resuelve providers', () => {
    const registry = new RepositoryProviderRegistry();
    const provider = {
      kind: 'github',
      getProjects: jest.fn(),
      getRepositories: jest.fn(),
      getPullRequests: jest.fn(),
      getBranches: jest.fn(),
      getRepositorySnapshot: jest.fn(),
    };

    registry.register(provider);

    expect(registry.get('github')).toBe(provider);
  });

  test('permite usar una instancia aislada del registry', () => {
    const registry = new RepositoryProviderRegistry();
    const provider = {
      kind: 'gitlab',
      getProjects: jest.fn(),
      getRepositories: jest.fn(),
      getPullRequests: jest.fn(),
      getBranches: jest.fn(),
      getRepositorySnapshot: jest.fn(),
    };

    registry.register(provider);

    expect(registry.get('gitlab')).toBe(provider);
    expect(registry.list()).toHaveLength(1);
  });
});
