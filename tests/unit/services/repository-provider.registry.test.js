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

  test('registerMany agrega multiples providers y clear los elimina', () => {
    const registry = new RepositoryProviderRegistry();
    registry.registerMany([
      { kind: 'github' },
      { kind: 'gitlab' },
    ]);

    expect(registry.list()).toHaveLength(2);
    registry.clear();
    expect(registry.list()).toHaveLength(0);
  });

  test('get lanza error si el provider no existe', () => {
    const registry = new RepositoryProviderRegistry();
    expect(() => registry.get('azure-devops')).toThrow(/aun no esta registrado/i);
  });
});
