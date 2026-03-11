jest.mock('../../../src/services/providers/repository-provider.registry', () => ({
  registerRepositoryProviderPorts: jest.fn(),
}));

const { registerRepositoryProviderPorts } = require('../../../src/services/providers/repository-provider.registry');
const bootstrap = require('../../../src/services/providers/repository-provider.bootstrap');

describe('repository provider bootstrap', () => {
  test('registra providers por defecto solo una vez', () => {
    bootstrap.registerDefaultRepositoryProviders();
    bootstrap.registerDefaultRepositoryProviders();

    expect(registerRepositoryProviderPorts).toHaveBeenCalledTimes(1);
    expect(registerRepositoryProviderPorts.mock.calls[0][0]).toHaveLength(3);
  });
});
