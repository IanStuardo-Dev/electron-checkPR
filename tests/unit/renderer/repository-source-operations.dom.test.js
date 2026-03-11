const { renderHook } = require('@testing-library/react');
const { useRepositorySourceOperations } = require('../../../src/renderer/features/dashboard/hooks/useRepositorySourceOperations');

describe('useRepositorySourceOperations dependency injection', () => {
  test('usa hooks inyectados para componer operaciones sin acoplar implementaciones concretas', () => {
    const state = {
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
      isConnectionPanelOpen: true,
    };
    const diagnostics = { diagnostics: { operation: null } };
    const actions = {
      resetForConfigChange: jest.fn(),
      selectProject: jest.fn(),
      openConnectionPanel: jest.fn(),
    };
    const api = {
      refreshPullRequests: jest.fn(),
      refreshProjects: jest.fn(),
      refreshRepositories: jest.fn(),
      discoverProjects: jest.fn(),
      openPullRequest: jest.fn(),
    };
    const deps = {
      useStateHook: jest.fn(() => state),
      useDiagnosticsHook: jest.fn(() => diagnostics),
      useActionsHook: jest.fn(() => actions),
      useApiHook: jest.fn(() => api),
    };

    const { result } = renderHook(() => useRepositorySourceOperations({
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
      dependencies: deps,
    }));

    expect(deps.useStateHook).toHaveBeenCalledWith('github');
    expect(deps.useDiagnosticsHook).toHaveBeenCalled();
    expect(deps.useActionsHook).toHaveBeenCalledWith({ state, diagnostics });
    expect(deps.useApiHook).toHaveBeenCalled();
    expect(result.current.refreshPullRequests).toBe(api.refreshPullRequests);
  });
});
