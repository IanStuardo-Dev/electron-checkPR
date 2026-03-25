const { renderHook, act } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/repository-source/data/repositorySourceBridge', () => ({
  fetchProjects: jest.fn(),
  fetchRepositories: jest.fn(),
  fetchPullRequests: jest.fn(),
  openReviewItem: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceEffects', () => ({
  useRepositorySourceEffects: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceState', () => ({
  useRepositorySourceState: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositoryDiagnostics', () => ({
  useRepositoryDiagnostics: jest.fn(),
}));

const bridge = require('../../../src/renderer/features/repository-source/data/repositorySourceBridge');
const { repositorySourceFetcher } = require('../../../src/renderer/features/repository-source/data/repositorySourceFetcher');
const { useRepositorySourceEffects } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceEffects');
const { useRepositorySourceState } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceState');
const { useRepositoryDiagnostics } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositoryDiagnostics');
const { useRepositorySourceApi } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceApi');
const { useRepositorySourceActions } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceActions');
const { useRepositorySourceController } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceController');
const actualStateModule = jest.requireActual('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceState');
const actualDiagnosticsModule = jest.requireActual('../../../src/renderer/features/repository-source/presentation/hooks/useRepositoryDiagnostics');
const actualEffectsModule = jest.requireActual('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceEffects');

function createStateMock() {
  return {
    pullRequests: [],
    projects: [],
    repositories: [],
    error: null,
    projectDiscoveryWarning: null,
    isLoading: false,
    projectsLoading: false,
    repositoriesLoading: false,
    lastUpdatedAt: null,
    hasSuccessfulConnection: false,
    shouldLoadRepositories: false,
    isConnectionPanelOpen: true,
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
    setShouldLoadRepositories: jest.fn(),
    setIsConnectionPanelOpen: jest.fn(),
    resetForConfigChange: jest.fn(),
    resetDisconnectedState: jest.fn(),
    markProjectSelection: jest.fn(),
  };
}

function createDiagnosticsMock() {
  return {
    diagnostics: {
      operation: null,
      provider: '',
      organization: '',
      project: '',
      repositoryId: '',
      requestPath: '',
      lastError: null,
    },
    updateDiagnostics: jest.fn(),
    resetDiagnosticsError: jest.fn(),
  };
}

describe('repository source hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('useRepositorySourceState resetea segun cambios de config', () => {
    const { result } = renderHook(() => actualStateModule.useRepositorySourceState('github'));

    act(() => {
      result.current.resetForConfigChange('organization', 'acme');
    });
    expect(result.current.projects).toEqual([]);
    expect(result.current.repositories).toEqual([]);

    act(() => {
      result.current.markProjectSelection('repo-a');
    });
    expect(result.current.shouldLoadRepositories).toBe(true);

    act(() => {
      result.current.resetForConfigChange('project', '');
    });
    expect(result.current.repositories).toEqual([]);
    expect(result.current.shouldLoadRepositories).toBe(false);

    act(() => {
      result.current.resetForConfigChange('provider', 'gitlab');
    });
    expect(result.current.projects).toEqual([]);
    expect(result.current.repositories).toEqual([]);
    expect(result.current.projectDiscoveryWarning).toBeNull();

    act(() => {
      result.current.resetDisconnectedState();
    });
    expect(result.current.projects).toEqual([]);
    expect(result.current.repositories).toEqual([]);
    expect(result.current.hasSuccessfulConnection).toBe(false);
  });

  test('useRepositoryDiagnostics actualiza request path y limpia error', () => {
    const { result } = renderHook(() => actualDiagnosticsModule.useRepositoryDiagnostics({
      provider: 'github',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }));

    act(() => {
      result.current.updateDiagnostics('pullRequests', {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: '',
        personalAccessToken: 'pat',
        targetReviewer: '',
      }, 'boom');
    });
    expect(result.current.diagnostics.requestPath).toContain('api.github.com/repos/acme/repo-a/pulls');

    act(() => {
      result.current.resetDiagnosticsError();
    });
    expect(result.current.diagnostics.lastError).toBeNull();

    act(() => {
      result.current.updateDiagnostics(null, {
        provider: '',
        organization: '',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      });
    });
    expect(result.current.diagnostics.requestPath).toBe('');
  });

  test('useRepositoryDiagnostics usa el builder tambien para el estado inicial', () => {
    const { result } = renderHook(() => actualDiagnosticsModule.useRepositoryDiagnostics({
      provider: 'azure-devops',
      organization: ' org ',
      project: ' platform ',
      repositoryId: ' repo-a ',
      personalAccessToken: '',
      targetReviewer: '',
    }));

    expect(result.current.diagnostics).toEqual(expect.objectContaining({
      operation: null,
      provider: 'azure-devops',
      organization: 'org',
      project: 'platform',
      repositoryId: 'repo-a',
      requestPath: '',
      lastError: null,
    }));
  });

  test('useRepositorySourceActions delega en state y diagnostics', () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    const { result } = renderHook(() => useRepositorySourceActions({ state, diagnostics }));

    act(() => {
      result.current.resetForConfigChange('provider', 'github');
      result.current.openConnectionPanel();
      result.current.selectProject('repo-a');
    });

    expect(state.resetForConfigChange).toHaveBeenCalledWith('provider', 'github');
    expect(diagnostics.resetDiagnosticsError).toHaveBeenCalled();
    expect(state.setIsConnectionPanelOpen).toHaveBeenCalledWith(true);
    expect(state.markProjectSelection).toHaveBeenCalledWith('repo-a');
  });

  test('useRepositorySourceApi sincroniza proyectos, repos y pull requests', async () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    bridge.fetchProjects.mockResolvedValue([{ id: 'repo-a', name: 'repo-a', state: 'active' }]);
    bridge.fetchRepositories.mockResolvedValue([{ id: 'repo-a', name: 'repo-a' }]);
    bridge.fetchPullRequests.mockResolvedValue([{ id: 1, title: 'PR' }]);
    bridge.openReviewItem.mockResolvedValue(undefined);

    const config = {
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    };
    const configRef = { current: config };
    const onPersistSnapshot = jest.fn();

    const { result } = renderHook(() => useRepositorySourceApi({
      config,
      configRef,
      activeProviderName: 'GitHub',
      scopeLabel: 'acme / all',
      state,
      diagnostics,
      onPersistSnapshot,
      fetcher: repositorySourceFetcher,
    }));

    await act(async () => {
      await result.current.discoverProjects();
      await result.current.refreshPullRequests();
      await result.current.openPullRequest('https://github.com/acme/repo-a/pull/1');
    });

    expect(bridge.fetchProjects).toHaveBeenCalled();
    expect(bridge.fetchRepositories).toHaveBeenCalled();
    expect(bridge.fetchPullRequests).toHaveBeenCalled();
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(true);
    expect(onPersistSnapshot).toHaveBeenCalled();
    expect(bridge.openReviewItem).toHaveBeenCalled();
  });

  test('useRepositorySourceEffects resetea estado o carga repos segun config', async () => {
    const state = createStateMock();
    const refreshRepositories = jest.fn().mockResolvedValue([]);
    const config = {
      provider: 'gitlab',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    };
    const configRef = { current: { ...config } };

    renderHook(() => actualEffectsModule.useRepositorySourceEffects({ config, configRef, state, refreshRepositories }));
    expect(state.resetDisconnectedState).toHaveBeenCalled();

    state.shouldLoadRepositories = true;
    config.organization = 'acme';
    config.personalAccessToken = 'pat';
    configRef.current = { ...config };

    renderHook(() => actualEffectsModule.useRepositorySourceEffects({ config, configRef, state, refreshRepositories }));
    await Promise.resolve();
    expect(refreshRepositories).toHaveBeenCalled();
    expect(state.setShouldLoadRepositories).toHaveBeenCalledWith(false);
  });

  test('useRepositorySourceEffects apaga la carga pendiente si falta config minima', () => {
    const state = createStateMock();
    state.shouldLoadRepositories = true;
    const refreshRepositories = jest.fn();
    const config = {
      provider: 'azure-devops',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    };

    renderHook(() => actualEffectsModule.useRepositorySourceEffects({
      config,
      configRef: { current: { ...config } },
      state,
      refreshRepositories,
    }));

    expect(refreshRepositories).not.toHaveBeenCalled();
    expect(state.setShouldLoadRepositories).toHaveBeenCalledWith(false);
  });

  test('useRepositorySourceController compone estado, acciones y api', () => {
    const state = createStateMock();
    const diagnostics = createDiagnosticsMock();
    useRepositorySourceState.mockReturnValue(state);
    useRepositoryDiagnostics.mockReturnValue(diagnostics);

    const { result } = renderHook(() => useRepositorySourceController({
      config: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        personalAccessToken: 'pat',
        targetReviewer: '',
      },
      configRef: { current: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        personalAccessToken: 'pat',
        targetReviewer: '',
      } },
      activeProviderName: 'GitHub',
      scopeLabel: 'acme / all',
      onPersistSnapshot: jest.fn(),
    }));

    expect(result.current.pullRequests).toBe(state.pullRequests);
    expect(useRepositorySourceEffects).toHaveBeenCalled();
  });
});


