const {
  canPrepareRepositoryAnalysisPreview,
  isRepositoryAnalysisStrictModeBlocked,
  canRunRepositoryAnalysis,
} = require('../../../src/renderer/features/repository-analysis/application/repositoryAnalysisGuards');

function createPreview(overrides = {}) {
  return {
    provider: 'github',
    repository: 'repo-a',
    branch: 'main',
    includedFiles: ['src/app.ts'],
    filesPrepared: 1,
    totalFilesDiscovered: 1,
    truncated: false,
    exclusions: {
      omittedByPrioritization: [],
      omittedBySize: [],
      omittedByBinaryDetection: [],
    },
    sensitivity: {
      findings: [],
      hasSensitiveConfigFiles: false,
      hasSecretPatterns: false,
      noSensitiveConfigFilesDetected: true,
      summary: 'Sin hallazgos.',
    },
    disclaimer: 'preview',
    ...overrides,
  };
}

function createCodexConfig(overrides = {}) {
  return {
    snapshotPolicy: {
      excludedPathPatterns: '',
      strictMode: false,
    },
    ...overrides,
  };
}

describe('repositoryAnalysisGuards', () => {
  test('canPrepareRepositoryAnalysisPreview exige todos los prerequisitos', () => {
    expect(canPrepareRepositoryAnalysisPreview({
      providerKind: 'github',
      activeProvider: { kind: 'github' },
      isConnectionReady: true,
      isCodexReady: true,
      repositoryId: 'repo-a',
      branchName: 'main',
      isRunning: false,
      isPreviewing: false,
    })).toBe(true);

    expect(canPrepareRepositoryAnalysisPreview({
      providerKind: 'github',
      activeProvider: { kind: 'github' },
      isConnectionReady: true,
      isCodexReady: true,
      repositoryId: 'repo-a',
      branchName: 'main',
      isRunning: true,
      isPreviewing: false,
    })).toBe(false);

    expect(canPrepareRepositoryAnalysisPreview({
      providerKind: '',
      activeProvider: null,
      isConnectionReady: false,
      isCodexReady: false,
      repositoryId: '',
      branchName: '',
      isRunning: false,
      isPreviewing: true,
    })).toBe(false);
  });

  test('isRepositoryAnalysisStrictModeBlocked solo bloquea con strict mode y sensibilidad', () => {
    expect(isRepositoryAnalysisStrictModeBlocked(
      createPreview({
        sensitivity: {
          findings: [],
          hasSensitiveConfigFiles: true,
          hasSecretPatterns: false,
          noSensitiveConfigFilesDetected: false,
          summary: 'Hay hallazgos.',
        },
      }),
      createCodexConfig({
        snapshotPolicy: {
          excludedPathPatterns: '',
          strictMode: true,
        },
      }),
    )).toBe(true);

    expect(isRepositoryAnalysisStrictModeBlocked(
      createPreview(),
      createCodexConfig({
        snapshotPolicy: {
          excludedPathPatterns: '',
          strictMode: true,
        },
      }),
    )).toBe(false);
  });

  test('canRunRepositoryAnalysis valida branch, provider y acknowledgement del snapshot', () => {
    const preview = createPreview();

    expect(canRunRepositoryAnalysis({
      providerKind: 'github',
      activeProvider: { kind: 'github' },
      isConnectionReady: true,
      isCodexReady: true,
      repositoryId: 'repo-a',
      branchName: 'main',
      preview,
      snapshotAcknowledged: true,
      isStrictModeBlocked: false,
      isRunning: false,
    })).toBe(true);

    expect(canRunRepositoryAnalysis({
      providerKind: 'github',
      activeProvider: { kind: 'github' },
      isConnectionReady: true,
      isCodexReady: true,
      repositoryId: 'repo-a',
      branchName: 'develop',
      preview,
      snapshotAcknowledged: true,
      isStrictModeBlocked: false,
      isRunning: false,
    })).toBe(false);

    expect(canRunRepositoryAnalysis({
      providerKind: 'github',
      activeProvider: { kind: 'gitlab' },
      isConnectionReady: true,
      isCodexReady: true,
      repositoryId: 'repo-a',
      branchName: 'main',
      preview,
      snapshotAcknowledged: true,
      isStrictModeBlocked: false,
      isRunning: false,
    })).toBe(false);

    expect(canRunRepositoryAnalysis({
      providerKind: 'github',
      activeProvider: { kind: 'github' },
      isConnectionReady: true,
      isCodexReady: true,
      repositoryId: 'repo-a',
      branchName: 'main',
      preview,
      snapshotAcknowledged: false,
      isStrictModeBlocked: false,
      isRunning: false,
    })).toBe(false);
  });
});
