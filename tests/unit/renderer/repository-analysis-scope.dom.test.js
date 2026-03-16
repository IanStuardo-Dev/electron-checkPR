const { renderHook, act } = require('@testing-library/react');

const mockUseRepositoryBranches = jest.fn();

jest.mock('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryBranches', () => ({
  useRepositoryBranches: (...args) => mockUseRepositoryBranches(...args),
}));

const { useRepositoryAnalysisScope } = require('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryAnalysisScope');

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
    analysisDepth: 'standard',
    maxFilesPerRun: 50,
    includeTests: false,
    repositoryScope: 'selected',
    apiKey: 'sk-live',
    snapshotPolicy: {
      excludedPathPatterns: 'dist/**',
      strictMode: false,
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
      customInstructions: '',
    },
    ...overrides,
  };
}

function createOptions(overrides = {}) {
  return {
    activeProvider: {
      kind: 'github',
      name: 'GitHub',
      status: 'available',
      description: 'GitHub Cloud',
      helperText: '',
    },
    config: createConfig(),
    repositories: [
      { id: 'repo-a', name: 'Repo A' },
      { id: 'repo-b', name: 'Repo B' },
    ],
    isConnectionReady: true,
    isCodexReady: true,
    codexConfig: createCodexConfig(),
    preview: null,
    isRunning: false,
    isPreviewing: false,
    preparePreview: jest.fn(),
    execute: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  };
}

describe('useRepositoryAnalysisScope', () => {
  beforeEach(() => {
    mockUseRepositoryBranches.mockReturnValue({
      branches: [
        { name: 'main', objectId: '1', isDefault: true },
        { name: 'develop', objectId: '2', isDefault: false },
      ],
      branchName: 'main',
      setBranchName: jest.fn(),
      isLoadingBranches: false,
      branchError: null,
    });
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prepara preview con el payload correcto y limpia acknowledgement previo', () => {
    const options = createOptions();
    const { result } = renderHook((props) => useRepositoryAnalysisScope(props), {
      initialProps: options,
    });

    act(() => {
      result.current.setSnapshotAcknowledged(true);
    });

    act(() => {
      result.current.handlePreparePreview();
    });

    expect(options.preparePreview).toHaveBeenCalledWith(expect.objectContaining({
      requestId: '1234567890-repo-a-main',
      repositoryId: 'repo-a',
      branchName: 'main',
      source: expect.objectContaining({
        provider: 'github',
        repositoryId: 'repo-a',
        project: 'repo-a',
      }),
    }));
    expect(result.current.snapshotAcknowledged).toBe(false);
    expect(result.current.selectedRepository).toEqual({ id: 'repo-a', name: 'Repo A' });
  });

  test('no prepara preview ni regenera si faltan prerequisitos o no hay exclusiones pendientes', () => {
    const options = createOptions({
      isConnectionReady: false,
      preview: createPreview(),
    });
    const { result } = renderHook((props) => useRepositoryAnalysisScope(props), {
      initialProps: options,
    });

    act(() => {
      result.current.handlePreparePreview();
      result.current.handleRegenerateWithExclusions();
    });

    expect(options.preparePreview).not.toHaveBeenCalled();
  });

  test('mantiene exclusiones pendientes sin duplicados y permite regenerar el snapshot', () => {
    const options = createOptions({
      preview: createPreview(),
    });
    const { result } = renderHook((props) => useRepositoryAnalysisScope(props), {
      initialProps: options,
    });

    act(() => {
      result.current.handleToggleExcludedPath('src/generated.ts', true);
      result.current.handleToggleExcludedPath('src/generated.ts', true);
      result.current.handleToggleExcludedPath('src/legacy.ts', true);
    });

    expect(result.current.pendingExcludedPaths).toEqual(['src/generated.ts', 'src/legacy.ts']);

    act(() => {
      result.current.handleRegenerateWithExclusions();
    });

    const payload = options.preparePreview.mock.calls[0][0];
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('dist/**');
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('src/generated.ts');
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('src/legacy.ts');

    act(() => {
      result.current.handleToggleExcludedPath('src/generated.ts', false);
    });

    expect(result.current.pendingExcludedPaths).toEqual(['src/legacy.ts']);
  });

  test('cambiar repositorio o rama limpia estado transitorio y dispara reset', () => {
    const branchState = {
      branches: [
        { name: 'main', objectId: '1', isDefault: true },
      ],
      branchName: 'main',
      setBranchName: jest.fn(),
      isLoadingBranches: false,
      branchError: null,
    };
    mockUseRepositoryBranches.mockReturnValue(branchState);

    const options = createOptions();
    const { result } = renderHook((props) => useRepositoryAnalysisScope(props), {
      initialProps: options,
    });

    act(() => {
      result.current.setSnapshotAcknowledged(true);
      result.current.handleToggleExcludedPath('src/legacy.ts', true);
    });

    act(() => {
      result.current.handleRepositoryChange('repo-b');
    });

    expect(options.reset).toHaveBeenCalledTimes(1);
    expect(result.current.repositoryId).toBe('repo-b');
    expect(result.current.pendingExcludedPaths).toEqual([]);
    expect(result.current.snapshotAcknowledged).toBe(false);

    act(() => {
      result.current.handleBranchChange('develop');
    });

    expect(branchState.setBranchName).toHaveBeenCalledWith('develop');
    expect(options.reset).toHaveBeenCalledTimes(2);
  });

  test('bloquea la ejecucion en strict mode y solo corre cuando el preview coincide y fue confirmado', () => {
    const blockedExecute = jest.fn();
    const { result, rerender } = renderHook((props) => useRepositoryAnalysisScope(props), {
      initialProps: createOptions({
        execute: blockedExecute,
        preview: createPreview({
          sensitivity: {
            findings: [],
            hasSensitiveConfigFiles: true,
            hasSecretPatterns: false,
            noSensitiveConfigFilesDetected: false,
            summary: 'Hay riesgo.',
          },
        }),
        codexConfig: createCodexConfig({
          snapshotPolicy: {
            excludedPathPatterns: 'dist/**',
            strictMode: true,
          },
        }),
      }),
    });

    act(() => {
      result.current.setSnapshotAcknowledged(true);
      result.current.handleRun();
    });

    expect(result.current.isStrictModeBlocked).toBe(true);
    expect(result.current.canRunAnalysis).toBe(false);
    expect(blockedExecute).not.toHaveBeenCalled();

    const execute = jest.fn();
    rerender(createOptions({
      execute,
      preview: createPreview(),
      codexConfig: createCodexConfig(),
    }));

    act(() => {
      result.current.setSnapshotAcknowledged(true);
    });

    act(() => {
      result.current.handleRun();
    });

    expect(result.current.canRunAnalysis).toBe(true);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      repositoryId: 'repo-a',
      branchName: 'main',
    }));
  });

  test('sincroniza repositoryId cuando cambia la configuracion persistida', () => {
    const options = createOptions({
      config: createConfig({
        repositoryId: 'repo-a',
      }),
    });
    const { result, rerender } = renderHook((props) => useRepositoryAnalysisScope(props), {
      initialProps: options,
    });

    expect(result.current.repositoryId).toBe('repo-a');

    rerender(createOptions({
      config: createConfig({
        repositoryId: 'repo-b',
      }),
    }));

    expect(result.current.repositoryId).toBe('repo-b');
    expect(result.current.selectedRepository).toEqual({ id: 'repo-b', name: 'Repo B' });
  });
});
