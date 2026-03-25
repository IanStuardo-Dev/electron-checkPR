const repositoryAnalysisBridge = require('../../../src/renderer/features/repository-analysis/data/repositoryAnalysisBridge');

describe('repository analysis bridge', () => {
  beforeEach(() => {
    global.window = {
      electronApi: {
        invoke: jest.fn(),
      },
    };
  });

  test('previewRepositorySnapshot usa el canal correcto', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: true,
      data: {
        provider: 'github',
        repository: 'repo-a',
        branch: 'main',
        includedFiles: ['src/app.ts'],
        filesPrepared: 1,
        totalFilesDiscovered: 3,
        truncated: true,
        exclusions: {
          omittedByPrioritization: ['src/legacy.ts'],
          omittedBySize: [],
          omittedByBinaryDetection: [],
        },
        disclaimer: 'Se enviara a Codex...',
      },
    });

    const payload = {
      requestId: 'req-preview',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'secret',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    };

    const result = await repositoryAnalysisBridge.previewRepositorySnapshot(payload);

    expect(window.electronApi.invoke).toHaveBeenCalledWith('analysis:previewRepositorySnapshot', payload);
    expect(result.filesPrepared).toBe(1);
  });

  test('runRepositoryAnalysis usa el canal correcto', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: true,
      data: {
        summary: 'ok',
        score: 80,
        riskLevel: 'medium',
        topConcerns: [],
        recommendations: [],
        findings: [],
        analyzedAt: '2026-03-11T00:00:00.000Z',
        provider: 'github',
        repository: 'repo-a',
        branch: 'main',
        model: 'gpt-5.2-codex',
        snapshot: {
          totalFilesDiscovered: 1,
          filesAnalyzed: 1,
          truncated: false,
        },
      },
    });

    const payload = {
      requestId: 'req-1',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'secret',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    };

    const result = await repositoryAnalysisBridge.runRepositoryAnalysis(payload);

    expect(window.electronApi.invoke).toHaveBeenCalledWith('analysis:runRepositoryAnalysis', payload);
    expect(result.summary).toBe('ok');
  });

  test('cancelRepositoryAnalysis propaga errores del proceso principal', async () => {
    window.electronApi.invoke.mockResolvedValue({
      ok: false,
      error: 'cancel failed',
    });

    await expect(repositoryAnalysisBridge.cancelRepositoryAnalysis('req-1')).rejects.toThrow('cancel failed');
  });

  test('previewRepositorySnapshot falla con un error controlado cuando no existe Electron', async () => {
    delete window.electronApi;

    await expect(repositoryAnalysisBridge.previewRepositorySnapshot({
      requestId: 'req-preview-web',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'secret',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('No se detecto el bridge de Electron');
  });
});

