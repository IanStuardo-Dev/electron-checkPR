const {
  createRepositoryProviderRegistry,
  createRepositoryProviderRegistryFromModules,
} = require('../../../src/services/providers/repository-provider.composition');
const {
  buildDefaultRepositoryProviderPorts,
  buildDefaultRepositoryProviderModules,
} = require('../../../src/services/providers/repository-provider.bootstrap');

describe('repository provider composition', () => {
  test('crea un registry poblado con providers por defecto', () => {
    const registry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
    expect(registry.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });

  test('crea un registry poblado desde modules enchufables', () => {
    const registry = createRepositoryProviderRegistryFromModules(buildDefaultRepositoryProviderModules());
    expect(registry.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });

  test('los providers por defecto exponen capacidades segregadas requeridas', () => {
    const registry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
    const providers = registry.list();

    providers.forEach((provider) => {
      expect(typeof provider.getProjects).toBe('function');
      expect(typeof provider.getRepositories).toBe('function');
      expect(typeof provider.getBranches).toBe('function');
      expect(typeof provider.getPullRequests).toBe('function');
      expect(typeof provider.getPullRequestSnapshot).toBe('function');
      expect(typeof provider.getRepositorySnapshot).toBe('function');
    });
  });
});
