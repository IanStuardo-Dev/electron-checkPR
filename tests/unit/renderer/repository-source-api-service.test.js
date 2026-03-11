const { createRepositorySourceApi } = require('../../../src/renderer/features/dashboard/repositorySourceApiService');

function createStateMock() {
  return {
    setPullRequests: jest.fn(),
    setProjects: jest.fn(),
    setRepositories: jest.fn(),
    setError: jest.fn(),
    setProjectDiscoveryWarning: jest.fn(),
    setIsLoading: jest.fn(),
    setProjectsLoading: jest.fn(),
    setRepositoriesLoading: jest.fn(),
    setLastUpdatedAt: jest.fn(),
    setHasSuccessfulConnection: jest.fn(),
    setIsConnectionPanelOpen: jest.fn(),
  };
}

function createDiagnosticsMock() {
  return {
    updateDiagnostics: jest.fn(),
  };
}

describe('repositorySourceApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('discoverProjects valida provider y credenciales antes de consultar', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const configRef = {
      current: {
        provider: '',
        organization: '',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      },
    };

    const api = createRepositorySourceApi({
      configRef,
      activeProviderName: 'GitHub',
      scopeLabel: 'sin scope',
      state,
      diagnostics,
      snapshot: {
        persistSnapshot: jest.fn(),
      },
      fetcher: {
        fetchProjects: jest.fn(),
        fetchRepositories: jest.fn(),
        fetchPullRequests: jest.fn(),
        openReviewItem: jest.fn(),
      },
    });

    await api.discoverProjects();

    expect(state.setError).toHaveBeenCalledWith('Selecciona un provider antes de cargar proyectos.');
    expect(diagnostics.updateDiagnostics).toHaveBeenCalledWith('projects', configRef.current, 'Selecciona un provider antes de cargar proyectos.');
  });

  test('refreshProjects para github replica proyectos como repositorios y limpia warnings', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const fetcher = {
      fetchProjects: jest.fn().mockResolvedValue([{ id: 'repo-a', name: 'repo-a', state: 'active' }]),
      fetchRepositories: jest.fn(),
      fetchPullRequests: jest.fn(),
      openReviewItem: jest.fn(),
    };
    const configRef = {
      current: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        personalAccessToken: 'pat',
        targetReviewer: '',
      },
    };

    const api = createRepositorySourceApi({
      configRef,
      activeProviderName: 'GitHub',
      scopeLabel: 'acme / all',
      state,
      diagnostics,
      snapshot: {
        persistSnapshot: jest.fn(),
      },
      fetcher,
    });

    const result = await api.refreshProjects();

    expect(result).toEqual([{ id: 'repo-a', name: 'repo-a', state: 'active' }]);
    expect(state.setProjects).toHaveBeenCalledWith(result);
    expect(state.setRepositories).toHaveBeenCalledWith([{ id: 'repo-a', name: 'repo-a' }]);
    expect(state.setProjectDiscoveryWarning).toHaveBeenCalledWith(null);
  });

  test('refreshRepositories reporta error y marca desconexion cuando falla', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const fetcher = {
      fetchProjects: jest.fn(),
      fetchRepositories: jest.fn().mockRejectedValue(new Error('repo fail')),
      fetchPullRequests: jest.fn(),
      openReviewItem: jest.fn(),
    };
    const configRef = {
      current: {
        provider: 'azure-devops',
        organization: 'org-a',
        project: 'core',
        repositoryId: '',
        personalAccessToken: 'pat',
        targetReviewer: '',
      },
    };

    const api = createRepositorySourceApi({
      configRef,
      activeProviderName: 'Azure DevOps',
      scopeLabel: 'org-a / core',
      state,
      diagnostics,
      snapshot: {
        persistSnapshot: jest.fn(),
      },
      fetcher,
    });

    await api.refreshRepositories();

    expect(state.setError).toHaveBeenCalledWith('repo fail');
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(false);
    expect(diagnostics.updateDiagnostics).toHaveBeenCalledWith('repositories', configRef.current, 'repo fail');
  });

  test('refreshPullRequests sincroniza y persiste snapshot cuando el flujo sale bien', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const fetcher = {
      fetchProjects: jest.fn().mockResolvedValue([{ id: 'repo-a', name: 'repo-a', state: 'active' }]),
      fetchRepositories: jest.fn().mockResolvedValue([{ id: 'repo-a', name: 'repo-a' }]),
      fetchPullRequests: jest.fn().mockResolvedValue([{ id: 1, title: 'PR' }]),
      openReviewItem: jest.fn(),
    };
    const onPersistSnapshot = jest.fn();
    const configRef = {
      current: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        personalAccessToken: 'pat',
        targetReviewer: 'ian',
      },
    };

    const api = createRepositorySourceApi({
      configRef,
      activeProviderName: 'GitHub',
      scopeLabel: 'acme / all',
      state,
      diagnostics,
      snapshot: {
        persistSnapshot: onPersistSnapshot,
      },
      fetcher,
    });

    await api.refreshPullRequests();

    expect(state.setPullRequests).toHaveBeenCalledWith([{ id: 1, title: 'PR' }]);
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(true);
    expect(state.setIsConnectionPanelOpen).toHaveBeenCalledWith(false);
    expect(onPersistSnapshot).toHaveBeenCalledWith(
      [{ id: 1, title: 'PR' }],
      expect.any(Date),
      'acme / all',
      'ian',
    );
  });

  test('openPullRequest expone error amigable cuando no hay provider activo', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const configRef = {
      current: {
        provider: '',
        organization: '',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      },
    };

    const api = createRepositorySourceApi({
      configRef,
      activeProviderName: 'No provider',
      scopeLabel: 'none',
      state,
      diagnostics,
      snapshot: {
        persistSnapshot: jest.fn(),
      },
      fetcher: {
        fetchProjects: jest.fn(),
        fetchRepositories: jest.fn(),
        fetchPullRequests: jest.fn(),
        openReviewItem: jest.fn(),
      },
    });

    await api.openPullRequest('https://example.com/pr/1');

    expect(state.setError).toHaveBeenCalledWith('Selecciona un provider antes de abrir un PR.');
  });
});
