jest.mock('../../../src/main/ipc/repository-providers', () => ({
  registerRepositoryProviderIpc: jest.fn(),
}));

jest.mock('../../../src/main/ipc/analysis', () => ({
  registerAnalysisIpc: jest.fn(),
}));

jest.mock('../../../src/main/ipc/session-secrets', () => ({
  SessionSecretsStore: jest.fn(),
  registerSessionSecretsIpc: jest.fn(),
}));

const { registerRepositoryProviderIpc } = require('../../../src/main/ipc/repository-providers');
const { registerAnalysisIpc } = require('../../../src/main/ipc/analysis');
const { SessionSecretsStore, registerSessionSecretsIpc } = require('../../../src/main/ipc/session-secrets');
const { registerIpcHandlers } = require('../../../src/main/ipc/register');

describe('ipc register', () => {
  test('registra todos los dominios ipc', () => {
    const providerRegistry = { get: jest.fn() };
    const repositoryAnalysisService = { runAnalysis: jest.fn(), cancelAnalysis: jest.fn() };
    const pullRequestAnalysisService = { analyzeBatch: jest.fn() };
    const sessionSecretsStoreInstance = {};
    SessionSecretsStore.mockImplementation(() => sessionSecretsStoreInstance);

    registerIpcHandlers(providerRegistry, repositoryAnalysisService, pullRequestAnalysisService);

    expect(registerRepositoryProviderIpc).toHaveBeenCalledWith(providerRegistry);
    expect(registerAnalysisIpc).toHaveBeenCalledWith(
      repositoryAnalysisService,
      pullRequestAnalysisService,
      sessionSecretsStoreInstance,
    );
    expect(SessionSecretsStore).toHaveBeenCalled();
    expect(registerSessionSecretsIpc).toHaveBeenCalledWith(sessionSecretsStoreInstance);
  });
});
