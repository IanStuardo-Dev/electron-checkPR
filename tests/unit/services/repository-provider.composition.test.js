const { createRepositoryProviderRegistry } = require('../../../src/services/providers/repository-provider.composition');
const { buildDefaultRepositoryProviderPorts } = require('../../../src/services/providers/repository-provider.bootstrap');

describe('repository provider composition', () => {
  test('crea un registry poblado con providers por defecto', () => {
    const registry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
    expect(registry.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });
});
