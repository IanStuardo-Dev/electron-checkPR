const { RepositoryAnalysisService } = require('../../../src/services/analysis/repository-analysis.service');
const { createRepositoryAnalysisService } = require('../../../src/services/analysis/repository-analysis.factory');

describe('RepositoryAnalysisService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function createServiceWithSnapshot(snapshot) {
    return createRepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue(snapshot),
      },
    });
  }

  test('acepta payload JSON en la raiz y lo convierte en resultado estructurado', async () => {
    const service = createServiceWithSnapshot({
      provider: 'github',
      repository: 'repo-a',
      branch: 'main',
      files: [{ path: 'src/index.ts', extension: 'ts', size: 32, content: 'export const ok = true;' }],
      totalFilesDiscovered: 1,
      truncated: true,
      partialReason: 'Se omitieron archivos binarios.',
      metrics: {
        durationMs: 321,
        retryCount: 2,
        discardedByPrioritization: ['src/legacy.ts'],
        discardedBySize: ['src/big.ts'],
        discardedByBinaryDetection: ['assets/logo.png'],
      },
    });

    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      summary: 'Resumen en espanol',
      score: 81,
      riskLevel: 'medium',
      topConcerns: ['Concern'],
      recommendations: ['Recommendation'],
      findings: [
        {
          id: 'finding-1',
          title: 'Titulo',
          severity: 'medium',
          category: 'testing',
          filePath: 'src/index.ts',
          detail: 'Detalle',
          recommendation: 'Recomendacion',
        },
      ],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const result = await service.runAnalysis({
      requestId: 'req-1',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    });

    expect(result.summary).toBe('Resumen en espanol');
    expect(result.snapshot.totalFilesDiscovered).toBe(1);
    expect(result.snapshot).toEqual(expect.objectContaining({
      truncated: true,
      partialReason: 'Se omitieron archivos binarios.',
      durationMs: 321,
      retryCount: 2,
      discardedByPrioritization: ['src/legacy.ts'],
      discardedBySize: ['src/big.ts'],
      discardedByBinaryDetection: ['assets/logo.png'],
    }));
  });

  test('previewSnapshot rechaza snapshots sin archivos legibles', async () => {
    const service = createServiceWithSnapshot({
      provider: 'github',
      repository: 'repo-a',
      branch: 'main',
      files: [],
      totalFilesDiscovered: 0,
      truncated: false,
    });

    await expect(service.previewSnapshot({
      requestId: 'req-preview-empty',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('No se encontraron archivos de codigo legibles para analizar en el scope seleccionado.');
  });

  test('runAnalysis exige apiKey antes de consultar providers remotos', async () => {
    const snapshotProvider = {
      getSnapshot: jest.fn(),
    };
    const service = new RepositoryAnalysisService({
      snapshotProvider,
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });

    await expect(service.runAnalysis({
      requestId: 'req-no-key',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: '   ',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('La API key de Codex es obligatoria para ejecutar el analisis.');

    expect(snapshotProvider.getSnapshot).not.toHaveBeenCalled();
  });

  test('mapea error 500 del proveedor remoto', async () => {
    const service = createServiceWithSnapshot({
      provider: 'github',
      repository: 'repo-a',
      branch: 'main',
      files: [{ path: 'src/index.ts', extension: 'ts', size: 32, content: 'export const ok = true;' }],
      totalFilesDiscovered: 1,
      truncated: false,
    });

    global.fetch = jest.fn().mockResolvedValue(new Response('Upstream failed hard', {
      status: 500,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(service.runAnalysis({
      requestId: 'req-2',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('Codex analysis failed (500): Upstream failed hard');
  });

  test('rechaza payload estructurado incompleto', async () => {
    const service = createServiceWithSnapshot({
      provider: 'github',
      repository: 'repo-a',
      branch: 'main',
      files: [{ path: 'src/index.ts', extension: 'ts', size: 32, content: 'export const ok = true;' }],
      totalFilesDiscovered: 1,
      truncated: false,
    });

    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      summary: 'Resumen',
      score: 10,
      riskLevel: 'high',
      topConcerns: ['Concern'],
      recommendations: ['Recommendation'],
      findings: [{ id: 'broken' }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(service.runAnalysis({
      requestId: 'req-3',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('Codex no devolvio salida estructurada.');
  });

  test('runAnalysis rechaza snapshots vacios y limpia la corrida activa', async () => {
    const service = createRepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          branch: 'main',
          files: [],
          totalFilesDiscovered: 0,
          truncated: false,
        }),
      },
    });

    await expect(service.runAnalysis({
      requestId: 'req-empty',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('No se encontraron archivos de codigo legibles para analizar en el scope seleccionado.');

    expect(service.activeRuns.size).toBe(0);
  });

  test('si el snapshot falla, limpia el estado interno de la corrida', async () => {
    const service = createRepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn().mockRejectedValue(new Error('provider down')),
      },
    });

    await expect(service.runAnalysis({
      requestId: 'req-snapshot-error',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    })).rejects.toThrow('provider down');

    expect(service.activeRuns.size).toBe(0);
  });

  test('cancela una corrida activa y limpia el estado interno', async () => {
    const service = new RepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          branch: 'main',
          files: [{ path: 'src/index.ts', extension: 'ts', size: 32, content: 'export const ok = true;' }],
          totalFilesDiscovered: 1,
          truncated: false,
        }),
      },
      promptBuilder: {
        build: jest.fn().mockReturnValue({ systemPrompt: 'system', userPrompt: 'user' }),
      },
      analysisClient: {
        analyze: jest.fn().mockImplementation(({ signal }) => new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        })),
      },
      responseParser: {
        parse: jest.fn(),
      },
    });

    const runPromise = service.runAnalysis({
      requestId: 'req-cancel',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    });

    await Promise.resolve();
    service.cancelAnalysis('req-cancel');

    const observed = runPromise.then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );

    const result = await observed;
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('El analisis fue cancelado antes de completarse.');
    expect(service.activeRuns.size).toBe(0);
  });

  test('aborta por timeout y limpia activeRuns', async () => {
    jest.useFakeTimers();
    const service = new RepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          branch: 'main',
          files: [{ path: 'src/index.ts', extension: 'ts', size: 32, content: 'export const ok = true;' }],
          totalFilesDiscovered: 1,
          truncated: false,
        }),
      },
      promptBuilder: {
        build: jest.fn().mockReturnValue({ systemPrompt: 'system', userPrompt: 'user' }),
      },
      analysisClient: {
        analyze: jest.fn().mockImplementation(({ signal }) => new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        })),
      },
      responseParser: {
        parse: jest.fn(),
      },
    });

    const runPromise = service.runAnalysis({
      requestId: 'req-timeout',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
      timeoutMs: 500,
    });
    const observed = runPromise.then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );

    await jest.advanceTimersByTimeAsync(500);

    const result = await observed;
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('El analisis remoto excedio el timeout de 1 segundos.');
    expect(service.activeRuns.size).toBe(0);
  });

  test('si se cancela antes de la consulta remota, aborta sin llamar al cliente de analisis', async () => {
    let resolveSnapshot;
    const snapshotPromise = new Promise((resolve) => {
      resolveSnapshot = resolve;
    });
    const analysisClient = {
      analyze: jest.fn(),
    };
    const service = new RepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn().mockReturnValue(snapshotPromise),
      },
      promptBuilder: {
        build: jest.fn(),
      },
      analysisClient,
      responseParser: {
        parse: jest.fn(),
      },
    });

    const runPromise = service.runAnalysis({
      requestId: 'req-cancel-before-remote',
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk-test',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
    });

    service.cancelAnalysis('req-cancel-before-remote');
    resolveSnapshot({
      provider: 'github',
      repository: 'repo-a',
      branch: 'main',
      files: [{ path: 'src/index.ts', extension: 'ts', size: 32, content: 'export const ok = true;' }],
      totalFilesDiscovered: 1,
      truncated: false,
    });

    await expect(runPromise).rejects.toThrow('El analisis fue cancelado antes de iniciar la consulta remota.');
    expect(analysisClient.analyze).not.toHaveBeenCalled();
    expect(service.activeRuns.size).toBe(0);
  });

  test('cancelAnalysis ignora requestIds desconocidos sin lanzar error', () => {
    const service = createRepositoryAnalysisService({
      snapshotProvider: {
        getSnapshot: jest.fn(),
      },
    });

    expect(() => service.cancelAnalysis('missing-run')).not.toThrow();
  });
});
