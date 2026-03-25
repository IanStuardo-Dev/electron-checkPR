jest.mock('../../../src/modules/runtime-host/presentation/adapters/repository-source-adapter', () => ({
  bindRepositorySourceProviderBridge: jest.fn(),
}));

jest.mock('../../../src/modules/runtime-host/presentation/adapters/analysis-adapter', () => ({
  bindAnalysisBridge: jest.fn(),
}));

jest.mock('../../../src/modules/runtime-host/application/analysis/use-cases/analysis.use-cases', () => ({
  createAnalysisOperations: jest.fn(() => ({ kind: 'analysis-handlers' })),
}));

jest.mock('../../../src/modules/runtime-host/infrastructure/electron/adapters/session-secrets-analysis-api-key-resolver', () => ({
  createAnalysisApiKeyResolver: jest.fn(() => ({ kind: 'api-key-resolver' })),
}));

jest.mock('../../../src/modules/runtime-host/infrastructure/electron/adapters/shell-external-link-opener', () => ({
  createShellExternalLinkOpener: jest.fn(() => ({ kind: 'external-link-opener' })),
}));

jest.mock('../../../src/modules/runtime-host/presentation/adapters/session-secrets-adapter', () => ({
  bindSessionSecretsStoreBridge: jest.fn(),
}));

jest.mock('../../../src/modules/runtime-host/presentation/adapters/window-controls-adapter', () => ({
  bindWindowControlsBridge: jest.fn(),
}));

const { bindRepositorySourceProviderBridge } = require('../../../src/modules/runtime-host/presentation/adapters/repository-source-adapter');
const { bindAnalysisBridge } = require('../../../src/modules/runtime-host/presentation/adapters/analysis-adapter');
const { createAnalysisOperations } = require('../../../src/modules/runtime-host/application/analysis/use-cases/analysis.use-cases');
const { createAnalysisApiKeyResolver } = require('../../../src/modules/runtime-host/infrastructure/electron/adapters/session-secrets-analysis-api-key-resolver');
const { createShellExternalLinkOpener } = require('../../../src/modules/runtime-host/infrastructure/electron/adapters/shell-external-link-opener');
const { bindSessionSecretsStoreBridge } = require('../../../src/modules/runtime-host/presentation/adapters/session-secrets-adapter');
const { bindWindowControlsBridge } = require('../../../src/modules/runtime-host/presentation/adapters/window-controls-adapter');
const { wireRuntimeHostBridge } = require('../../../src/main/runtime-host-bridge-registration');

describe('bridge register', () => {
  test('registra todos los dominios bridge', () => {
    const providerRegistry = { get: jest.fn() };
    const repositoryAnalysisService = { runAnalysis: jest.fn(), cancelAnalysis: jest.fn() };
    const pullRequestAnalysisService = { analyzeBatch: jest.fn() };
    const sessionSecretsStoreInstance = {};

    wireRuntimeHostBridge(providerRegistry, repositoryAnalysisService, pullRequestAnalysisService, sessionSecretsStoreInstance);

    expect(createShellExternalLinkOpener).toHaveBeenCalled();
    expect(bindRepositorySourceProviderBridge).toHaveBeenCalledWith(providerRegistry, { kind: 'external-link-opener' });
    expect(createAnalysisApiKeyResolver).toHaveBeenCalledWith(sessionSecretsStoreInstance);
    expect(createAnalysisOperations).toHaveBeenCalledWith(
      repositoryAnalysisService,
      pullRequestAnalysisService,
      { kind: 'api-key-resolver' },
    );
    expect(bindAnalysisBridge).toHaveBeenCalledWith({ kind: 'analysis-handlers' });
    expect(bindSessionSecretsStoreBridge).toHaveBeenCalledWith(sessionSecretsStoreInstance);
    expect(bindWindowControlsBridge).toHaveBeenCalled();
  });
});







