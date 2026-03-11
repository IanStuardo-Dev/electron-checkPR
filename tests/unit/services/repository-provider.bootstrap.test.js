const bootstrap = require('../../../src/services/providers/repository-provider.bootstrap');

describe('repository provider bootstrap', () => {
  test('construye los providers por defecto sin depender de estado global', () => {
    const providers = bootstrap.buildDefaultRepositoryProviderPorts();

    expect(providers).toHaveLength(3);
    expect(providers.map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });
});
