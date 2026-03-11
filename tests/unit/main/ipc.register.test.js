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
    registerIpcHandlers();

    expect(registerRepositoryProviderIpc).toHaveBeenCalled();
    expect(registerAnalysisIpc).toHaveBeenCalled();
    expect(SessionSecretsStore).toHaveBeenCalled();
    expect(registerSessionSecretsIpc).toHaveBeenCalled();
  });
});
