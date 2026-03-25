const { PullRequestAnalysisService } = require('../../../src/services/analysis/pull-request-analysis.service');

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

describe('PullRequestAnalysisService', () => {
  test('previewBatch construye previews respetando strictMode', async () => {
    const snapshotProvider = {
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
          { path: '.env', status: 'modified', patch: '+ SECRET=1' },
          { path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' },
        ],
        totalFilesChanged: 2,
        truncated: false,
      }),
    };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });

    const previews = await service.previewBatch(createRequest({
      snapshotPolicy: {
        excludedPathPatterns: '',
        strictMode: true,
      },
    }));

    expect(previews).toHaveLength(1);
    expect(previews[0]).toEqual(expect.objectContaining({
      repository: 'repo-a',
      pullRequestId: 88,
      strictModeWouldBlock: true,
    }));
  });

  test('previewBatch limita concurrencia con previewConcurrency', async () => {
    let active = 0;
    let maxActive = 0;
    const snapshotProvider = {
      getSnapshot: jest.fn(async (_source, pullRequest) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return {
          provider: 'github',
          repository: 'repo-a',
          pullRequestId: pullRequest.id,
          title: `PR ${pullRequest.id}`,
          description: 'Ajustes',
          author: 'Ian',
          sourceBranch: 'feature',
          targetBranch: 'main',
          reviewers: [],
          files: [
            { path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' },
          ],
          totalFilesChanged: 1,
          truncated: false,
        };
      }),
    };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });

    await service.previewBatch(createRequest({
      previewConcurrency: 2,
      items: [
        { pullRequest: { ...createRequest().items[0].pullRequest, id: 1 } },
        { pullRequest: { ...createRequest().items[0].pullRequest, id: 2 } },
        { pullRequest: { ...createRequest().items[0].pullRequest, id: 3 } },
        { pullRequest: { ...createRequest().items[0].pullRequest, id: 4 } },
      ],
    }));

    expect(maxActive).toBeLessThanOrEqual(2);
    expect(snapshotProvider.getSnapshot).toHaveBeenCalledTimes(4);
  });

  test('cuando falta apiKey devuelve reviews not-configured sin consultar snapshots', async () => {
    const snapshotProvider = {
      getSnapshot: jest.fn(),
    };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });

    const result = await service.analyzeBatch(createRequest({
      apiKey: '   ',
    }));

    expect(result).toEqual([
      expect.objectContaining({
        pullRequestId: 88,
        status: 'not-configured',
        coverageNote: 'Codex no configurado para PR AI review.',
      }),
    ]);
    expect(snapshotProvider.getSnapshot).not.toHaveBeenCalled();
  });

  test('omite PRs sin diff textual suficiente y no llama al cliente remoto', async () => {
    const snapshotProvider = {
      getSnapshot: jest.fn().mockResolvedValue({
        provider: 'azure-devops',
        repository: 'repo-a',
        pullRequestId: 88,
        title: 'Actualizar auth',
        description: 'Ajustes de seguridad',
        author: 'Ian',
        sourceBranch: 'feature/auth',
        targetBranch: 'main',
        reviewers: [],
        files: [
          { path: 'src/auth.ts', status: 'modified' },
        ],
        totalFilesChanged: 1,
        truncated: false,
        partialReason: 'Azure DevOps no entrego patch textual para este PR; el snapshot contiene solo metadata de archivos cambiados.',
      }),
    };
    const promptBuilder = { build: jest.fn() };
    const analysisClient = { analyze: jest.fn() };
    const responseParser = { parse: jest.fn() };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder,
      analysisClient,
      responseParser,
    });

    const result = await service.analyzeBatch(createRequest());

    expect(result[0].status).toBe('omitted');
    expect(result[0].coverageNote).toMatch(/no entrego patch textual|no incluye diff textual suficiente/i);
    expect(analysisClient.analyze).not.toHaveBeenCalled();
  });

  test('en strict mode omite PRs con cobertura parcial y archivos sensibles por nombre', async () => {
    const snapshotProvider = {
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
        partialReason: '1 archivos del PR no incluyen patch textual en la respuesta del provider.',
      }),
    };
    const promptBuilder = { build: jest.fn() };
    const analysisClient = { analyze: jest.fn() };
    const responseParser = { parse: jest.fn() };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder,
      analysisClient,
      responseParser,
    });

    const result = await service.analyzeBatch(createRequest({
      snapshotPolicy: {
        excludedPathPatterns: '',
        strictMode: true,
      },
    }));

    expect(result[0].status).toBe('omitted');
    expect(result[0].coverageNote).toMatch(/modo estricto/i);
    expect(analysisClient.analyze).not.toHaveBeenCalled();
  });

  test('en strict mode usa el mensaje de sensibilidad cuando hay secretos en el diff', async () => {
    const service = new PullRequestAnalysisService({
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
            { path: 'src/auth.ts', status: 'modified', patch: '+ const access_token = \"abcdefgh123456\";' },
          ],
          totalFilesChanged: 1,
          truncated: false,
        }),
      },
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });

    const result = await service.analyzeBatch(createRequest({
      snapshotPolicy: {
        excludedPathPatterns: '',
        strictMode: true,
      },
    }));

    expect(result[0].status).toBe('omitted');
    expect(result[0].coverageNote).toBe('PR omitido por modo estricto y señales sensibles en el diff.');
  });

  test('analiza PRs validos, acota el riskScore y conserva coverageNote parcial', async () => {
    const snapshotProvider = {
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
          { path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' },
        ],
        totalFilesChanged: 1,
        truncated: false,
        partialReason: 'Solo se cargo un subconjunto del diff.',
      }),
    };
    const promptBuilder = { build: jest.fn().mockReturnValue('prompt') };
    const analysisClient = { analyze: jest.fn().mockResolvedValue('raw-output') };
    const responseParser = {
      parse: jest.fn().mockReturnValue({
        riskScore: 999,
        shortSummary: 'Resumen corto',
        topConcerns: ['auth'],
        reviewChecklist: ['agregar tests'],
      }),
    };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder,
      analysisClient,
      responseParser,
    });

    const result = await service.analyzeBatch(createRequest({
      requestId: 'batch-success',
    }));

    expect(result).toEqual([
      expect.objectContaining({
        pullRequestId: 88,
        status: 'analyzed',
        riskScore: 100,
        shortSummary: 'Resumen corto',
        coverageNote: 'Solo se cargo un subconjunto del diff.',
      }),
    ]);
    expect(service.activeRuns.size).toBe(0);
  });

  test('si el cliente remoto falla con un valor no-Error devuelve un mensaje generico', async () => {
    const service = new PullRequestAnalysisService({
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
            { path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' },
          ],
          totalFilesChanged: 1,
          truncated: false,
        }),
      },
      promptBuilder: { build: jest.fn().mockReturnValue('prompt') },
      analysisClient: {
        analyze: jest.fn().mockRejectedValue('network down'),
      },
      responseParser: { parse: jest.fn() },
    });

    const result = await service.analyzeBatch(createRequest({
      requestId: 'batch-generic-error',
    }));

    expect(result[0]).toEqual(expect.objectContaining({
      status: 'error',
      error: 'No fue posible analizar el PR.',
    }));
  });

  test('permite cancelar una corrida en lote y limpia el request activo', async () => {
    const snapshotProvider = {
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
          { path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' },
        ],
        totalFilesChanged: 1,
        truncated: false,
      }),
    };
    const promptBuilder = { build: jest.fn().mockReturnValue('prompt') };
    const analysisClient = {
      analyze: jest.fn(({ signal }) => new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(new Error('cancelled'));
          return;
        }
        signal.addEventListener('abort', () => reject(new Error('cancelled')));
      })),
    };
    const responseParser = { parse: jest.fn() };
    const service = new PullRequestAnalysisService({
      snapshotProvider,
      promptBuilder,
      analysisClient,
      responseParser,
    });
    const pending = service.analyzeBatch(createRequest({ requestId: 'batch-1', timeoutMs: 30000 }));

    await Promise.resolve();
    service.cancelAnalysis('batch-1');
    const result = await pending;

    expect(result[0].status).toBe('error');
    expect(result[0].error).toMatch(/cancelled/i);
    expect(service.activeRuns.size).toBe(0);
  });

  test('cancelAnalysis ignora requestIds inexistentes', () => {
    const service = new PullRequestAnalysisService({
      snapshotProvider: { getSnapshot: jest.fn() },
      promptBuilder: { build: jest.fn() },
      analysisClient: { analyze: jest.fn() },
      responseParser: { parse: jest.fn() },
    });

    expect(() => service.cancelAnalysis('missing-batch')).not.toThrow();
  });
});
