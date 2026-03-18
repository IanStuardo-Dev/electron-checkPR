const { renderHook } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceState', () => ({
  useRepositorySourceState: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositoryDiagnostics', () => ({
  useRepositoryDiagnostics: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceActions', () => ({
  useRepositorySourceActions: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceApi', () => ({
  useRepositorySourceApi: jest.fn(),
}));

const stateModule = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceState');
const diagnosticsModule = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositoryDiagnostics');
const actionsModule = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceActions');
const apiModule = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceApi');
const { useRepositorySourceController } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceController');

describe('useRepositorySourceController', () => {
  test('compone estado, diagnosticos, acciones y api sin inyeccion artificial de hooks', () => {
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

    stateModule.useRepositorySourceState.mockReturnValue(state);
    diagnosticsModule.useRepositoryDiagnostics.mockReturnValue(diagnostics);
    actionsModule.useRepositorySourceActions.mockReturnValue(actions);
    apiModule.useRepositorySourceApi.mockReturnValue(api);

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

    expect(stateModule.useRepositorySourceState).toHaveBeenCalledWith('github');
    expect(diagnosticsModule.useRepositoryDiagnostics).toHaveBeenCalled();
    expect(actionsModule.useRepositorySourceActions).toHaveBeenCalledWith({ state, diagnostics });
    expect(apiModule.useRepositorySourceApi).toHaveBeenCalled();
    expect(result.current.refreshPullRequests).toBe(api.refreshPullRequests);
  });
});
