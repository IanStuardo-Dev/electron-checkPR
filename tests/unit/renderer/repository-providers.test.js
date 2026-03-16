const { repositoryProviders, getRepositoryProvider } = require('../../../src/renderer/features/repository-source/providers');

describe('repository providers', () => {
  test('expone providers soportados y devuelve null para selecciones invalidas', () => {
    expect(repositoryProviders.map((provider) => provider.kind)).toEqual([
      'azure-devops',
      'github',
      'gitlab',
      'bitbucket',
    ]);

    expect(getRepositoryProvider('github')).toEqual(expect.objectContaining({
      kind: 'github',
      status: 'available',
    }));
    expect(getRepositoryProvider('')).toBeNull();
    expect(getRepositoryProvider('unknown')).toBeNull();
  });
});
