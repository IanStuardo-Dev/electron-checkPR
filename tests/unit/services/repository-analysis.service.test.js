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
      truncated: false,
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
});
