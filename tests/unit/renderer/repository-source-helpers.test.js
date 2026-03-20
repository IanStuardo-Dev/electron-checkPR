const diagnostics = require('../../../src/renderer/features/repository-source/application/repositorySourceDiagnostics');
const providerBehavior = require('../../../src/renderer/features/repository-source/application/repositorySourceProviderBehavior');
const rules = require('../../../src/renderer/features/repository-source/application/repositorySourceRules');

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

    const gitlab = diagnostics.buildDiagnostics('pullRequests', {
      provider: 'gitlab',
      organization: 'acme/platform',
      project: '',
      repositoryId: 'acme/platform/repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    });
    const noProvider = diagnostics.buildDiagnostics(null, {
      provider: '',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });

    expect(gitlab.requestPath).toContain(encodeURIComponent('acme/platform/repo-a'));
    expect(noProvider.requestPath).toBe('');
  });

  test('getProviderDisplayName devuelve fallback si no hay provider', () => {
    expect(diagnostics.getProviderDisplayName(null)).toBe('Sin provider seleccionado');
  });

  test('buildScopeLabel cubre fallbacks por provider y seleccion', () => {
    expect(diagnostics.buildScopeLabel({
      provider: 'gitlab',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, null, null)).toBe('No organization / Todos los repositorios');

    expect(diagnostics.buildScopeLabel({
      provider: 'azure-devops',
      organization: 'org',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, null, null)).toBe('org / Sin proyecto / Todos los repositorios');
  });

  test('provider behavior centraliza el cambio de config y la seleccion de proyecto', () => {
    const githubBehavior = providerBehavior.getRepositorySourceProviderBehavior('github');
    const azureBehavior = providerBehavior.getRepositorySourceProviderBehavior('azure-devops');

    expect(githubBehavior.applyProjectSelection({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, 'repo-a')).toEqual(expect.objectContaining({
      project: 'repo-a',
      repositoryId: 'repo-a',
    }));

    expect(azureBehavior.applyProjectSelection({
      provider: 'azure-devops',
      organization: 'org',
      project: '',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    }, 'platform')).toEqual(expect.objectContaining({
      project: 'platform',
      repositoryId: '',
    }));

    expect(githubBehavior.mirrorsProjectsAsRepositories).toBe(true);
    expect(azureBehavior.mirrorsProjectsAsRepositories).toBe(false);
    expect(githubBehavior.hasMinimumRepositoryConfig({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    })).toBe(true);
    expect(azureBehavior.hasMinimumRepositoryConfig({
      provider: 'azure-devops',
      organization: 'org',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    })).toBe(false);
    expect(providerBehavior.getRepositorySourceProviderBehavior('bitbucket')).toBeNull();
  });

  test('cada provider namespace resuelve su requestPath sin condicionales compartidos', () => {
    const githubBehavior = providerBehavior.getRepositorySourceProviderBehavior('github');
    const gitlabBehavior = providerBehavior.getRepositorySourceProviderBehavior('gitlab');

    const githubPullRequestsPath = githubBehavior.buildRequestPath('pullRequests', {
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    });
    const gitlabPullRequestsPath = gitlabBehavior.buildRequestPath('pullRequests', {
      provider: 'gitlab',
      organization: 'acme/platform',
      project: '',
      repositoryId: 'acme/platform/repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    });

    expect(githubPullRequestsPath).toBe('https://api.github.com/repos/acme/repo-a/pulls');
    expect(gitlabPullRequestsPath).toBe(`https://gitlab.com/api/v4/projects/${encodeURIComponent('acme/platform/repo-a')}/merge_requests`);
    expect(githubBehavior.buildRequestPath(null, {
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    })).toBe('');
    expect(gitlabBehavior.buildRequestPath(null, {
      provider: 'gitlab',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    })).toBe('');
  });

  test('hasMinimumProjectDiscoveryConfig y hasMinimumRepositoryConfig validan por provider', () => {
    expect(rules.hasMinimumProjectDiscoveryConfig({
      provider: 'github',
      organization: ' acme ',
      project: '',
      repositoryId: '',
      personalAccessToken: ' pat ',
      targetReviewer: '',
    })).toBe(true);

    expect(rules.hasMinimumProjectDiscoveryConfig({
      provider: 'github',
      organization: '   ',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    })).toBe(false);

    expect(rules.hasMinimumRepositoryConfig({
      provider: 'gitlab',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    })).toBe(true);

    expect(rules.hasMinimumRepositoryConfig({
      provider: 'azure-devops',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    })).toBe(false);
  });
});
