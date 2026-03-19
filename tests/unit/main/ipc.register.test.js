jest.mock('../../../src/main/ipc/repository-providers', () => ({
  registerRepositoryProviderIpc: jest.fn(),
}));

jest.mock('../../../src/main/ipc/analysis', () => ({
  registerAnalysisIpc: jest.fn(),
}));

jest.mock('../../../src/main/ipc/analysis-handlers', () => ({
  createAnalysisIpcHandlers: jest.fn(() => ({ kind: 'analysis-handlers' })),
}));

jest.mock('../../../src/main/ipc/analysis-api-key-resolver', () => ({
  createAnalysisApiKeyResolver: jest.fn(() => ({ kind: 'api-key-resolver' })),
}));

jest.mock('../../../src/main/ipc/session-secrets', () => ({
  SessionSecretsStore: jest.fn(),
  registerSessionSecretsIpc: jest.fn(),
}));

jest.mock('../../../src/main/ipc/window-controls', () => ({
  registerWindowControlsIpc: jest.fn(),
}));

const { registerRepositoryProviderIpc } = require('../../../src/main/ipc/repository-providers');
const { registerAnalysisIpc } = require('../../../src/main/ipc/analysis');
const { createAnalysisIpcHandlers } = require('../../../src/main/ipc/analysis-handlers');
const { createAnalysisApiKeyResolver } = require('../../../src/main/ipc/analysis-api-key-resolver');
const { SessionSecretsStore, registerSessionSecretsIpc } = require('../../../src/main/ipc/session-secrets');
const { registerWindowControlsIpc } = require('../../../src/main/ipc/window-controls');
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
    expect(createAnalysisApiKeyResolver).toHaveBeenCalledWith(sessionSecretsStoreInstance);
    expect(createAnalysisIpcHandlers).toHaveBeenCalledWith(
      repositoryAnalysisService,
      pullRequestAnalysisService,
      { kind: 'api-key-resolver' },
    );
    expect(registerAnalysisIpc).toHaveBeenCalledWith({ kind: 'analysis-handlers' });
    expect(SessionSecretsStore).toHaveBeenCalled();
    expect(registerSessionSecretsIpc).toHaveBeenCalledWith(sessionSecretsStoreInstance);
    expect(registerWindowControlsIpc).toHaveBeenCalled();
  });
});
