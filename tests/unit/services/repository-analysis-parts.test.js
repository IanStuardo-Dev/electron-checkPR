const { RepositoryAnalysisPromptBuilder } = require('../../../src/services/analysis/repository-analysis.prompt-builder');
const { RepositoryAnalysisResponseParser } = require('../../../src/services/analysis/repository-analysis.response-parser');
const { OpenAIRepositoryAnalysisClient } = require('../../../src/services/analysis/repository-analysis.openai-client');
const { RepositoryAnalysisSnapshotProvider } = require('../../../src/services/analysis/repository-analysis.snapshot-provider');
const { RepositoryAnalysisService } = require('../../../src/services/analysis/repository-analysis.service');

describe('repository analysis parts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prompt builder incorpora politicas del usuario', () => {
    const builder = new RepositoryAnalysisPromptBuilder();
    const prompt = builder.build({
      analysisDepth: 'deep',
      promptDirectives: {
        architectureReviewEnabled: true,
        architecturePattern: 'hexagonal',
        requiredPractices: 'tests first',
        forbiddenPractices: 'god object',
        domainContext: 'payments',
        customInstructions: 'prioriza seguridad',
      },
    }, {
      provider: 'github',
      repository: 'repo-a',
      branch: 'main',
      files: [{ path: 'src/app.ts', size: 20, content: 'export const ok = true;' }],
      totalFilesDiscovered: 1,
      filesAnalyzed: 1,
      truncated: false,
      durationMs: 10,
      retryCount: 0,
      discardedByPrioritization: 0,
      discardedBySize: 0,
      discardedByBinaryDetection: 0,
    });

    expect(prompt.systemPrompt).toContain('Respond in Spanish');
    expect(prompt.userPrompt).toContain('hexagonal');
    expect(prompt.userPrompt).toContain('god object');
  });

  test('response parser acepta output_text y estructura raiz', () => {
    const parser = new RepositoryAnalysisResponseParser();
    const structured = {
      summary: 'Resumen',
      score: 80,
      riskLevel: 'medium',
      topConcerns: ['uno'],
      recommendations: ['dos'],
      findings: [{
        id: 'f1',
        title: 'Titulo',
        severity: 'low',
        category: 'testing',
        filePath: 'src/a.ts',
        detail: 'Detalle',
        recommendation: 'Accion',
      }],
    };

    expect(parser.parse(JSON.stringify(structured)).summary).toBe('Resumen');
    expect(parser.parse(JSON.stringify({ output_text: JSON.stringify(structured) })).score).toBe(80);
  });

  test('openai client mapea insufficient_quota', async () => {
    const client = new OpenAIRepositoryAnalysisClient();
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'insufficient_quota' },
    }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(client.analyze({
      request: {
        model: 'gpt-5.2-codex',
        apiKey: 'sk-test',
      },
      prompt: { systemPrompt: 'system', userPrompt: 'user' },
      signal: new AbortController().signal,
    })).rejects.toThrow('insufficient_quota');
  });

  test('snapshot provider resuelve el provider y adapta el source config', async () => {
    const provider = {
      getRepositorySnapshot: jest.fn().mockResolvedValue({ files: [] }),
    };
    const snapshotProvider = new RepositoryAnalysisSnapshotProvider({
      get: jest.fn().mockReturnValue(provider),
    });

    await snapshotProvider.getSnapshot({
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      maxFilesPerRun: 50,
      includeTests: false,
    });

    expect(provider.getRepositorySnapshot).toHaveBeenCalledWith(expect.objectContaining({
      project: 'repo-a',
      repositoryId: 'repo-a',
    }), {
      branchName: 'main',
      maxFiles: 50,
      includeTests: false,
    });
  });

  test('analysis service construye preview con sensibilidad local', async () => {
    const service = new RepositoryAnalysisService({
      getSnapshot: jest.fn().mockResolvedValue({
        provider: 'github',
        repository: 'repo-a',
        branch: 'main',
        files: [
          { path: '.env', extension: 'env', size: 20, content: 'SECRET=abc12345678' },
          { path: 'src/app.ts', extension: 'ts', size: 20, content: 'export const ok = true;' },
        ],
        totalFilesDiscovered: 2,
        truncated: false,
        exclusions: {
          omittedByPrioritization: [],
          omittedBySize: [],
          omittedByBinaryDetection: [],
        },
      }),
    });

    const preview = await service.previewSnapshot({
      requestId: 'req-preview',
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
      apiKey: 'sk',
      analysisDepth: 'standard',
      maxFilesPerRun: 20,
      includeTests: false,
    });

    expect(preview.sensitivity.hasSensitiveConfigFiles).toBe(true);
    expect(preview.sensitivity.hasSecretPatterns).toBe(true);
    expect(preview.disclaimer).toContain('alertas de sensibilidad');
  });
});
