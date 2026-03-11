jest.mock('electron', () => ({
  shell: {
    openExternal: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/main/ipc/shared', () => ({
  registerHandle: jest.fn(),
}));

const { shell } = require('electron');
const { registerHandle } = require('../../../src/main/ipc/shared');
const { registerRepositoryProviderIpc } = require('../../../src/main/ipc/repository-providers');

describe('repository providers ipc', () => {
  beforeEach(() => {
    registerHandle.mockReset();
    shell.openExternal.mockClear();
  });

  test('registra handlers para gateway de providers y enlaces externos', async () => {
    const provider = {
      getPullRequests: jest.fn().mockResolvedValue([]),
      getProjects: jest.fn().mockResolvedValue([]),
      getRepositories: jest.fn().mockResolvedValue([]),
      getBranches: jest.fn().mockResolvedValue([]),
    };
    const providerRegistry = {
      get: jest.fn().mockReturnValue(provider),
    };

    registerRepositoryProviderIpc(providerRegistry);

    expect(registerHandle).toHaveBeenCalledTimes(5);
    const pullRequestsHandler = registerHandle.mock.calls[0][1];
    const openExternalHandler = registerHandle.mock.calls[4][1];

    await pullRequestsHandler({ provider: 'github' });
    await openExternalHandler('https://github.com/acme/repo/pull/1');

    expect(providerRegistry.get).toHaveBeenCalledWith('github');
    expect(provider.getPullRequests).toHaveBeenCalledWith({ provider: 'github' });
    expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/acme/repo/pull/1');
  });

  test('falla si no se envía provider', async () => {
    registerRepositoryProviderIpc({ get: jest.fn() });
    const pullRequestsHandler = registerHandle.mock.calls[0][1];

    await expect(pullRequestsHandler({ provider: '' })).rejects.toThrow('Selecciona un provider');
  });
});
