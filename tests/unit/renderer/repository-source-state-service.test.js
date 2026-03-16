const stateService = require('../../../src/renderer/features/repository-source/application/repositorySourceStateService');

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
  };
}

describe('repositorySourceStateService', () => {
  test('clear helpers limpian proyectos y repositorios', () => {
    const state = createStateMock();
    stateService.clearProjectsState(state);
    stateService.clearRepositoriesState(state);

    expect(state.setProjects).toHaveBeenCalledWith([]);
    expect(state.setRepositories).toHaveBeenCalledWith([]);
  });

  test('applyProjectsSuccess replica proyectos en repos para github y gitlab', () => {
    const state = createStateMock();
    const projects = [{ id: 'repo-a', name: 'Repo A' }];

    stateService.applyProjectsSuccess(state, 'github', projects);
    stateService.applyProjectsSuccess(state, 'gitlab', projects);

    expect(state.setProjects).toHaveBeenCalledWith(projects);
    expect(state.setRepositories).toHaveBeenCalledWith([{ id: 'repo-a', name: 'Repo A' }]);
    expect(state.setProjectDiscoveryWarning).toHaveBeenCalledWith(null);
  });

  test('applyProjectsFailure traduce 404 a warning manual', () => {
    const state = createStateMock();
    stateService.applyProjectsFailure(state, 'request failed (404)');

    expect(state.setProjects).toHaveBeenCalledWith([]);
    expect(state.setProjectDiscoveryWarning).toHaveBeenCalledWith(
      expect.stringMatching(/Puedes escribir el proyecto manualmente/i),
    );
  });

  test('applyRepositoriesFailure marca error y desconexion', () => {
    const state = createStateMock();
    stateService.applyRepositoriesFailure(state, 'repo fail');
    expect(state.setError).toHaveBeenCalledWith('repo fail');
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(false);
  });

  test('applyPullRequestsSuccess actualiza timestamp y cierra panel', () => {
    const state = createStateMock();
    const result = [{ id: 1 }];
    const timestamp = stateService.applyPullRequestsSuccess(state, result);

    expect(timestamp).toBeInstanceOf(Date);
    expect(state.setPullRequests).toHaveBeenCalledWith(result);
    expect(state.setLastUpdatedAt).toHaveBeenCalledWith(timestamp);
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(true);
    expect(state.setIsConnectionPanelOpen).toHaveBeenCalledWith(false);
  });

  test('applyPullRequestsFailure limpia estado operativo', () => {
    const state = createStateMock();
    stateService.applyPullRequestsFailure(state, 'boom');

    expect(state.setPullRequests).toHaveBeenCalledWith([]);
    expect(state.setLastUpdatedAt).toHaveBeenCalledWith(null);
    expect(state.setHasSuccessfulConnection).toHaveBeenCalledWith(false);
    expect(state.setError).toHaveBeenCalledWith('boom');
  });
});
