jest.mock('electron', () => ({
  shell: {
    openExternal: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/modules/runtime-host/presentation/adapters/bridge-response', () => ({
  registerBridgeCommand: jest.fn(),
}));

const { shell } = require('electron');
const { registerBridgeCommand } = require('../../../src/modules/runtime-host/presentation/adapters/bridge-response');
const { bindRepositorySourceProviderBridge } = require('../../../src/modules/runtime-host/presentation/adapters/repository-source-adapter');

describe('repository providers bridge', () => {
  beforeEach(() => {
    registerBridgeCommand.mockReset();
    shell.openExternal.mockClear();
  });

  test('registra handlers para gateway de providers y enlaces externos', async () => {
    const provider = {
      getPullRequests: jest.fn().mockResolvedValue([]),
      getProjects: jest.fn().mockResolvedValue([{ id: 'project-a' }]),
      getRepositories: jest.fn().mockResolvedValue([{ id: 'repo-a' }]),
      getBranches: jest.fn().mockResolvedValue([{ name: 'main' }]),
    };
    const providerRegistry = {
      get: jest.fn().mockReturnValue(provider),
    };
    const externalLinkOpener = {
      openExternal: shell.openExternal,
    };

    bindRepositorySourceProviderBridge(providerRegistry, externalLinkOpener);

    expect(registerBridgeCommand).toHaveBeenCalledTimes(5);
    const pullRequestsHandler = registerBridgeCommand.mock.calls[0][1];
    const projectsHandler = registerBridgeCommand.mock.calls[1][1];
    const repositoriesHandler = registerBridgeCommand.mock.calls[2][1];
    const branchesHandler = registerBridgeCommand.mock.calls[3][1];
    const openExternalHandler = registerBridgeCommand.mock.calls[4][1];

    await pullRequestsHandler({ provider: 'github' });
    await expect(projectsHandler({ provider: 'github' })).resolves.toEqual([{ id: 'project-a' }]);
    await expect(repositoriesHandler({ provider: 'github' })).resolves.toEqual([{ id: 'repo-a' }]);
    await expect(branchesHandler({ provider: 'github' })).resolves.toEqual([{ name: 'main' }]);
    await openExternalHandler('https://github.com/acme/repo/pull/1');

    expect(providerRegistry.get).toHaveBeenCalledWith('github');
    expect(provider.getPullRequests).toHaveBeenCalledWith({ provider: 'github' });
    expect(provider.getProjects).toHaveBeenCalledWith({ provider: 'github' });
    expect(provider.getRepositories).toHaveBeenCalledWith({ provider: 'github' });
    expect(provider.getBranches).toHaveBeenCalledWith({ provider: 'github' });
    expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/acme/repo/pull/1');
  });

  test('falla si no se envía provider', async () => {
    bindRepositorySourceProviderBridge({ get: jest.fn() }, { openExternal: shell.openExternal });
    const pullRequestsHandler = registerBridgeCommand.mock.calls[0][1];

    await expect(pullRequestsHandler({ provider: '' })).rejects.toThrow('Selecciona un provider');
  });

  test('rechaza providers sin capability de repository source', async () => {
    bindRepositorySourceProviderBridge({ get: jest.fn() }, { openExternal: shell.openExternal });
    const pullRequestsHandler = registerBridgeCommand.mock.calls[0][1];

    await expect(pullRequestsHandler({ provider: 'bitbucket' })).rejects.toThrow(
      'El provider bitbucket aun no soporta operaciones de repository source.',
    );
  });

  test('openExternal rechaza URLs no validas', async () => {
    bindRepositorySourceProviderBridge({ get: jest.fn() }, { openExternal: shell.openExternal });
    const openExternalHandler = registerBridgeCommand.mock.calls[4][1];

    await expect(openExternalHandler('javascript:alert(1)')).rejects.toThrow('Solo se permiten URLs externas con https.');
    expect(shell.openExternal).not.toHaveBeenCalled();
  });
});








