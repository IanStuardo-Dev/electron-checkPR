const diagnostics = require('../../../src/renderer/features/dashboard/repositorySourceDiagnostics');

describe('repository source helpers', () => {
  test('buildScopeLabel soporta github/gitlab y azure', () => {
    expect(diagnostics.buildScopeLabel({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, null, null)).toBe('acme / Todos los repositorios');

    expect(diagnostics.buildScopeLabel({
      provider: 'azure-devops',
      organization: 'org',
      project: 'proj',
      repositoryId: 'repo',
      personalAccessToken: '',
      targetReviewer: '',
    }, 'Project One', 'Repo A')).toBe('org / Project One / Repo A');
  });

  test('buildDiagnostics arma request paths por provider', () => {
    const github = diagnostics.buildDiagnostics('pullRequests', {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });
    const azure = diagnostics.buildDiagnostics('repositories', {
      provider: 'azure-devops',
      organization: 'org',
      project: 'proj',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });

    expect(github.requestPath).toContain('api.github.com/repos/acme/repo-a/pulls');
    expect(azure.requestPath).toContain('dev.azure.com/org/proj/_apis/git/repositories');
  });

  test('getProviderDisplayName devuelve fallback si no hay provider', () => {
    expect(diagnostics.getProviderDisplayName(null)).toBe('Sin provider seleccionado');
  });
});
