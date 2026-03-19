const {
  getRepositoryProviderCapabilities,
  isRepositoryProviderKind,
  supportsRepositoryProviderCapability,
} = require('../../../src/services/providers/repository-provider.capabilities');

describe('repository provider capabilities', () => {
  test('expone capabilities centralizadas para providers implementados', () => {
    expect(getRepositoryProviderCapabilities('github')).toEqual({
      supportsRepositorySource: true,
      supportsRepositoryAnalysis: true,
      supportsPullRequestAnalysis: true,
    });
  });

  test('marca bitbucket como provider conocido pero no soportado', () => {
    expect(isRepositoryProviderKind('bitbucket')).toBe(true);
    expect(supportsRepositoryProviderCapability('bitbucket', 'supportsRepositorySource')).toBe(false);
    expect(supportsRepositoryProviderCapability('bitbucket', 'supportsRepositoryAnalysis')).toBe(false);
    expect(supportsRepositoryProviderCapability('bitbucket', 'supportsPullRequestAnalysis')).toBe(false);
  });

  test('ignora valores desconocidos', () => {
    expect(isRepositoryProviderKind('svn')).toBe(false);
  });
});
