const {
  createFetchProjectsUseCase,
  createFetchRepositoriesUseCase,
  createSyncPullRequestsUseCase,
  createDiscoverProjectsUseCase,
  createOpenExternalLinkUseCase,
} = require('../../../src/renderer/features/dashboard/repositorySourceUseCases');

function createStateMock() {
  return {
    setProjects: jest.fn(),
    setRepositories: jest.fn(),
    setProjectDiscoveryWarning: jest.fn(),
    setError: jest.fn(),
    setHasSuccessfulConnection: jest.fn(),
    setPullRequests: jest.fn(),
    setLastUpdatedAt: jest.fn(),
    setIsConnectionPanelOpen: jest.fn(),
    setProjectsLoading: jest.fn(),
    setRepositoriesLoading: jest.fn(),
    setIsLoading: jest.fn(),
  };
}

function createDiagnosticsMock() {
  return {
    updateDiagnostics: jest.fn(),
  };
}

describe('repositorySourceUseCases', () => {
  test('fetchProjects no consulta si falta config minima', async () => {
    const fetcher = { fetchProjects: jest.fn() };
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const useCase = createFetchProjectsUseCase({
      fetcher,
      state,
      diagnostics,
      activeProviderName: 'GitHub',
    });

    const result = await useCase({
      provider: 'github',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });

    expect(result).toEqual([]);
    expect(fetcher.fetchProjects).not.toHaveBeenCalled();
    expect(state.setProjects).toHaveBeenCalledWith([]);
  });

  test('fetchProjects maneja error y apaga loading', async () => {
    const fetcher = { fetchProjects: jest.fn().mockRejectedValue(new Error('boom')) };
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const useCase = createFetchProjectsUseCase({
      fetcher,
      state,
      diagnostics,
      activeProviderName: 'GitHub',
    });

    await useCase({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    });

    expect(state.setProjectsLoading).toHaveBeenNthCalledWith(1, true);
    expect(state.setProjectsLoading).toHaveBeenLastCalledWith(false);
    expect(diagnostics.updateDiagnostics).toHaveBeenLastCalledWith(
      'projects',
      expect.any(Object),
      'boom',
    );
  });

  test('fetchRepositories no consulta si falta project/repo minimo', async () => {
    const fetcher = { fetchRepositories: jest.fn() };
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const useCase = createFetchRepositoriesUseCase({
      fetcher,
      state,
      diagnostics,
      activeProviderName: 'Azure DevOps',
    });

    const result = await useCase({
      provider: 'azure-devops',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    });

    expect(result).toEqual([]);
    expect(fetcher.fetchRepositories).not.toHaveBeenCalled();
    expect(state.setRepositories).toHaveBeenCalledWith([]);
  });

  test('syncPullRequests falla si no hay provider', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const useCase = createSyncPullRequestsUseCase({
      fetcher: { fetchPullRequests: jest.fn() },
      state,
      diagnostics,
      snapshot: { persistSnapshot: jest.fn() },
      activeProviderName: 'No provider',
      scopeLabel: 'none',
    });

    await useCase(
      {
        provider: '',
        organization: '',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      },
      jest.fn(),
      jest.fn(),
    );

    expect(state.setError).toHaveBeenCalledWith('Selecciona un provider antes de sincronizar.');
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(false);
  });

  test('discoverProjects valida credenciales minimas', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const useCase = createDiscoverProjectsUseCase({
      state,
      diagnostics,
      activeProviderName: 'GitHub',
    });

    await useCase({
      provider: 'github',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, jest.fn());

    expect(state.setError).toHaveBeenCalledWith(
      'El alcance principal y el token son obligatorios para cargar GitHub.',
    );
  });

  test('openExternalLink captura error del fetcher', async () => {
    const state = createStateMock();
    const fetcher = {
      openReviewItem: jest.fn().mockRejectedValue(new Error('cannot open')),
    };
    const useCase = createOpenExternalLinkUseCase({
      fetcher,
      state,
      configRef: {
        current: {
          provider: 'github',
          organization: 'acme',
          project: '',
          repositoryId: '',
          personalAccessToken: 'pat',
          targetReviewer: '',
        },
      },
    });

    await useCase('https://example.com/pr/1');
    expect(state.setError).toHaveBeenCalledWith('cannot open');
  });
});
