const { PullRequestAnalysisItemAnalyzer } = require('../../../src/services/analysis/pull-request-analysis.item-analyzer');

function createRequest(overrides = {}) {
  return {
    source: {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    },
    apiKey: 'sk-live',
    model: 'gpt-5.2-codex',
    analysisDepth: 'standard',
    snapshotPolicy: {
      excludedPathPatterns: '',
      strictMode: false,
    },
    promptDirectives: {
      focusAreas: '',
      customInstructions: '',
    },
    items: [
      {
        pullRequest: {
          id: 88,
          title: 'Actualizar auth',
          description: 'Ajustes de seguridad',
          repository: 'repo-a',
          url: 'https://example.com/pr/88',
          status: 'active',
          createdAt: '2026-03-10T10:00:00.000Z',
          updatedAt: '2026-03-10T12:00:00.000Z',
          createdBy: { displayName: 'Ian' },
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          mergeStatus: 'succeeded',
          isDraft: false,
          reviewers: [],
        },
      },
    ],
    ...overrides,
  };
}

describe('PullRequestAnalysisItemAnalyzer', () => {
  test('omite el analisis cuando el snapshot no incluye diff textual', async () => {
    const analysisClient = { analyze: jest.fn() };
    const analyzer = new PullRequestAnalysisItemAnalyzer({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          pullRequestId: 88,
          title: 'Actualizar auth',
          description: 'Ajustes de seguridad',
          author: 'Ian',
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          reviewers: [],
          files: [{ path: 'src/auth.ts', status: 'modified' }],
          totalFilesChanged: 1,
          truncated: false,
          partialReason: 'Sin patch textual.',
        }),
      },
      promptBuilder: { build: jest.fn() },
      analysisClient,
      responseParser: { parse: jest.fn() },
    });
    const request = createRequest();

    const result = await analyzer.analyzeItem(request, request.items[0]);

    expect(result).toEqual(expect.objectContaining({
      pullRequestId: 88,
      status: 'omitted',
      coverageNote: 'Sin patch textual.',
    }));
    expect(analysisClient.analyze).not.toHaveBeenCalled();
  });

  test('en modo estricto usa mensaje de sensibilidad por configuracion', async () => {
    const analyzer = new PullRequestAnalysisItemAnalyzer({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          pullRequestId: 88,
          title: 'Actualizar auth',
          description: 'Ajustes de seguridad',
          author: 'Ian',
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          reviewers: [],
          files: [
            { path: '.env', status: 'modified' },
            { path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' },
          ],
          totalFilesChanged: 2,
          truncated: false,
          partialReason: 'Patch parcial.',
        }),
      },
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });
    const request = createRequest({
      snapshotPolicy: {
        excludedPathPatterns: '',
        strictMode: true,
      },
    });

    const result = await analyzer.analyzeItem(request, request.items[0]);

    expect(result).toEqual(expect.objectContaining({
      status: 'omitted',
      coverageNote: 'PR omitido por modo estricto: se detectaron archivos potencialmente sensibles y la cobertura del diff es incompleta.',
    }));
  });

  test('analiza un item valido y libera el AbortController al finalizar', async () => {
    const onControllerCreated = jest.fn();
    const onControllerDisposed = jest.fn();
    const analyzer = new PullRequestAnalysisItemAnalyzer({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          pullRequestId: 88,
          title: 'Actualizar auth',
          description: 'Ajustes de seguridad',
          author: 'Ian',
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          reviewers: [],
          files: [{ path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' }],
          totalFilesChanged: 1,
          truncated: false,
          partialReason: 'Solo se cargo una parte del diff.',
        }),
      },
      promptBuilder: {
        build: jest.fn().mockReturnValue({ systemPrompt: 'system', userPrompt: 'user' }),
      },
      analysisClient: {
        analyze: jest.fn().mockResolvedValue('raw-output'),
      },
      responseParser: {
        parse: jest.fn().mockReturnValue({
          riskScore: 105,
          shortSummary: 'Resumen corto',
          topConcerns: ['auth'],
          reviewChecklist: ['agregar tests'],
        }),
      },
    });
    const request = createRequest({ timeoutMs: 5000 });

    const result = await analyzer.analyzeItem(
      request,
      request.items[0],
      { onControllerCreated, onControllerDisposed },
    );

    expect(result).toEqual(expect.objectContaining({
      status: 'analyzed',
      riskScore: 100,
      shortSummary: 'Resumen corto',
      coverageNote: 'Solo se cargo una parte del diff.',
    }));
    expect(onControllerCreated).toHaveBeenCalledTimes(1);
    expect(onControllerDisposed).toHaveBeenCalledTimes(1);
    expect(onControllerDisposed.mock.calls[0][0]).toBe(onControllerCreated.mock.calls[0][0]);
  });

  test('cuando el cliente remoto falla con valor no-Error usa mensaje generico', async () => {
    const analyzer = new PullRequestAnalysisItemAnalyzer({
      snapshotProvider: {
        getSnapshot: jest.fn().mockResolvedValue({
          provider: 'github',
          repository: 'repo-a',
          pullRequestId: 88,
          title: 'Actualizar auth',
          description: 'Ajustes de seguridad',
          author: 'Ian',
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          reviewers: [],
          files: [{ path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' }],
          totalFilesChanged: 1,
          truncated: false,
        }),
      },
      promptBuilder: {
        build: jest.fn().mockReturnValue({ systemPrompt: 'system', userPrompt: 'user' }),
      },
      analysisClient: {
        analyze: jest.fn().mockRejectedValue('network down'),
      },
      responseParser: { parse: jest.fn() },
    });
    const request = createRequest();

    const result = await analyzer.analyzeItem(request, request.items[0]);

    expect(result).toEqual(expect.objectContaining({
      status: 'error',
      error: 'No fue posible analizar el PR.',
    }));
  });
});
