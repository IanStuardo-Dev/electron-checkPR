const { buildRepositoryAnalysisPayload } = require('../../../src/renderer/features/repository-analysis/application/repositoryAnalysisPayload');

function createConfig(overrides = {}) {
  return {
    provider: 'github',
    organization: 'acme',
    project: 'repo-a',
    repositoryId: 'repo-a',
    personalAccessToken: 'pat',
    targetReviewer: '',
    ...overrides,
  };
}

function createCodexConfig(overrides = {}) {
  return {
    enabled: true,
    model: 'gpt-5.2-codex',
    analysisDepth: 'deep',
    maxFilesPerRun: 42,
    includeTests: true,
    repositoryScope: 'selected',
    apiKey: 'sk-live',
    snapshotPolicy: {
      excludedPathPatterns: 'dist/**',
      strictMode: true,
    },
    prReview: {
      enabled: true,
      maxPullRequests: 2,
      selectionMode: 'top-risk',
      analysisDepth: 'standard',
      promptDirectives: {
        focusAreas: '',
        customInstructions: '',
      },
    },
    promptDirectives: {
      architectureReviewEnabled: true,
      architecturePattern: 'clean',
      requiredPractices: 'tests',
      forbiddenPractices: 'any',
      domainContext: 'repo',
      customInstructions: 'be strict',
    },
    ...overrides,
  };
}

describe('repositoryAnalysisPayload', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('construye un payload GitHub con secretos omitidos y exclusiones fusionadas', () => {
    const payload = buildRepositoryAnalysisPayload({
      activeProvider: {
        kind: 'github',
        name: 'GitHub',
        status: 'available',
        description: 'GitHub Cloud',
        helperText: '',
      },
      config: createConfig(),
      repositoryId: 'repo-a',
      branchName: 'main',
      codexConfig: createCodexConfig(),
      pendingExcludedPaths: ['src/generated.ts', 'src/generated.ts', 'src/legacy.ts'],
    });

    expect(payload).toEqual(expect.objectContaining({
      requestId: '1234567890-repo-a-main',
      repositoryId: 'repo-a',
      branchName: 'main',
      apiKey: '',
      model: 'gpt-5.2-codex',
      analysisDepth: 'deep',
      maxFilesPerRun: 42,
      includeTests: true,
      timeoutMs: 90000,
      source: expect.objectContaining({
        provider: 'github',
        project: 'repo-a',
        repositoryId: 'repo-a',
      }),
    }));

    expect(payload.snapshotPolicy).toEqual(expect.objectContaining({
      strictMode: true,
    }));
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('dist/**');
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('src/generated.ts');
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('src/legacy.ts');
    expect(payload.promptDirectives.customInstructions).toBe('be strict');
  });

  test('preserva el project original cuando el provider es Azure DevOps', () => {
    const payload = buildRepositoryAnalysisPayload({
      activeProvider: {
        kind: 'azure-devops',
        name: 'Azure DevOps',
        status: 'available',
        description: 'Azure',
        helperText: '',
      },
      config: createConfig({
        provider: 'azure-devops',
        project: 'platform-team',
        repositoryId: 'legacy-repo',
      }),
      repositoryId: 'repo-from-selector',
      branchName: 'release',
      codexConfig: createCodexConfig(),
      pendingExcludedPaths: [],
    });

    expect(payload.source.project).toBe('platform-team');
    expect(payload.source.repositoryId).toBe('repo-from-selector');
    expect(payload.source.provider).toBe('azure-devops');
  });
});
