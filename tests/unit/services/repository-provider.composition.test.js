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
});
