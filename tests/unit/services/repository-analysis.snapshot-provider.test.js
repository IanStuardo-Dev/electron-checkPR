const {
  RepositoryAnalysisSnapshotProvider,
} = require('../../../src/services/analysis/repository-analysis.snapshot-provider');
const {
  resolveRepositoryAnalysisSourceConfig,
} = require('../../../src/services/analysis/repository-analysis.source-resolver');

function buildRequest(provider, overrides = {}) {
  return {
    requestId: 'request-1',
    source: {
      provider,
      organization: 'acme',
      project: 'platform',
      repositoryId: 'legacy-repository',
      personalAccessToken: 'pat',
      targetReviewer: 'qa-user',
    },
    repositoryId: 'new-repository',
    branchName: 'main',
    model: 'gpt-5-mini',
    apiKey: 'sk-test',
    analysisDepth: 'standard',
    maxFilesPerRun: 120,
    includeTests: true,
    snapshotPolicy: {
      excludedPathPatterns: '**/*.snap',
      strictMode: false,
    },
    ...overrides,
  };
}

describe('repository analysis source resolver', () => {
  test('mantiene el project original para Azure DevOps', () => {
    const request = buildRequest('azure-devops');

    expect(resolveRepositoryAnalysisSourceConfig(request)).toEqual({
      ...request.source,
      repositoryId: request.repositoryId,
      project: request.source.project,
    });
  });

  test('para providers no Azure usa repositoryId como project si viene informado', () => {
    const request = buildRequest('github');

    expect(resolveRepositoryAnalysisSourceConfig(request)).toEqual({
      ...request.source,
      repositoryId: request.repositoryId,
      project: request.repositoryId,
    });
  });
});

describe('RepositoryAnalysisSnapshotProvider', () => {
  test('resuelve source config y options antes de pedir snapshot al provider', async () => {
    const getRepositorySnapshot = jest.fn().mockResolvedValue({ ok: true });
    const providerRegistry = {
      get: jest.fn().mockReturnValue({ getRepositorySnapshot }),
    };
    const request = buildRequest('gitlab');
    const snapshotProvider = new RepositoryAnalysisSnapshotProvider(providerRegistry);

    await expect(snapshotProvider.getSnapshot(request)).resolves.toEqual({ ok: true });

    expect(providerRegistry.get).toHaveBeenCalledWith('gitlab');
    expect(getRepositorySnapshot).toHaveBeenCalledWith(
      {
        ...request.source,
        repositoryId: request.repositoryId,
        project: request.repositoryId,
      },
      {
        branchName: request.branchName,
        maxFiles: request.maxFilesPerRun,
        includeTests: request.includeTests,
        excludedPathPatterns: request.snapshotPolicy.excludedPathPatterns,
      },
    );
  });
});
