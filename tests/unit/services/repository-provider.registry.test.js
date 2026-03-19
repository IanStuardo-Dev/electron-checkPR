const {
  RepositoryProviderRegistryBuilder,
} = require('../../../src/services/providers/repository-provider.registry');

describe('RepositoryProviderRegistryBuilder', () => {
  test('registra y resuelve providers en el runtime generado', () => {
    const registryBuilder = new RepositoryProviderRegistryBuilder();
    const provider = {
      kind: 'github',
      getProjects: jest.fn(),
      getRepositories: jest.fn(),
      getPullRequests: jest.fn(),
      getBranches: jest.fn(),
      getRepositorySnapshot: jest.fn(),
    };

    registryBuilder.register(provider);
    const registry = registryBuilder.build();

    expect(registry.get('github')).toBe(provider);
  });

  test('permite generar runtimes aislados desde el builder', () => {
    const registryBuilder = new RepositoryProviderRegistryBuilder();
    const provider = {
      kind: 'gitlab',
      getProjects: jest.fn(),
      getRepositories: jest.fn(),
      getPullRequests: jest.fn(),
      getBranches: jest.fn(),
      getRepositorySnapshot: jest.fn(),
    };

    registryBuilder.register(provider);
    const registry = registryBuilder.build();

    expect(registry.get('gitlab')).toBe(provider);
    expect(registry.list()).toHaveLength(1);
  });

  test('registerMany agrega multiples providers y clear limpia el builder', () => {
    const registryBuilder = new RepositoryProviderRegistryBuilder();
    registryBuilder.registerMany([
      { kind: 'github' },
      { kind: 'gitlab' },
    ]);

    expect(registryBuilder.build().list()).toHaveLength(2);
    registryBuilder.clear();
    expect(registryBuilder.build().list()).toHaveLength(0);
  });

  test('el runtime generado no cambia si el builder muta despues', () => {
    const registryBuilder = new RepositoryProviderRegistryBuilder();
    registryBuilder.register({ kind: 'github' });

    const runtimeRegistry = registryBuilder.build();
    registryBuilder.register({ kind: 'azure-devops' });

    expect(runtimeRegistry.list()).toEqual([{ kind: 'github' }]);
  });

  test('get lanza error si el provider no existe', () => {
    const registry = new RepositoryProviderRegistryBuilder().build();
    expect(() => registry.get('azure-devops')).toThrow(/aun no esta registrado/i);
  });
});
