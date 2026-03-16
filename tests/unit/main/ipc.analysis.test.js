jest.mock('../../../src/main/ipc/shared', () => ({
  registerHandle: jest.fn(),
}));

const { registerHandle } = require('../../../src/main/ipc/shared');
const analysisShared = require('../../../src/main/ipc/analysis.shared');
const {
  sanitizeAnalysisPayload,
  sanitizePullRequestAnalysisPayload,
  registerAnalysisIpc,
} = require('../../../src/main/ipc/analysis');

describe('analysis ipc', () => {
  beforeEach(() => {
    registerHandle.mockReset();
  });

  test('sanitizeAnalysisPayload y sanitizePullRequestAnalysisPayload rechazan payloads invalidos', () => {
    expect(() => sanitizeAnalysisPayload(null)).toThrow('El payload de analisis es invalido.');
    expect(() => sanitizeAnalysisPayload({
      requestId: 'req-1',
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk',
    })).toThrow('La fuente del analisis es obligatoria.');

    expect(() => sanitizePullRequestAnalysisPayload(null)).toThrow('El payload de PR analysis es invalido.');
    expect(() => sanitizePullRequestAnalysisPayload({
      model: 'gpt-5.2-codex',
      apiKey: 'sk',
      items: [],
    })).toThrow('La fuente del PR analysis es obligatoria.');
  });

  test('sanitizeAnalysisPayload normaliza limites y directivas', () => {
    const payload = sanitizeAnalysisPayload({
      requestId: '  req-1 ',
      source: {
        provider: 'github',
        organization: ' acme ',
        project: ' repo-a ',
        repositoryId: ' repo-a ',
        personalAccessToken: ' pat ',
      },
      repositoryId: ' repo-a ',
      branchName: ' main ',
      model: ' gpt-5.2-codex ',
      apiKey: ' sk ',
      analysisDepth: 'deep',
      maxFilesPerRun: 999,
      includeTests: true,
      snapshotPolicy: {
        excludedPathPatterns: '.env\n*.pem',
        strictMode: true,
      },
      timeoutMs: 999999,
      promptDirectives: {
        architectureReviewEnabled: true,
        architecturePattern: 'hexagonal',
      },
    });

    expect(payload.maxFilesPerRun).toBe(200);
    expect(payload.timeoutMs).toBe(120000);
    expect(payload.source.organization).toBe('acme');
    expect(payload.snapshotPolicy.excludedPathPatterns).toContain('.env');
    expect(payload.snapshotPolicy.strictMode).toBe(true);
    expect(payload.promptDirectives.architecturePattern).toBe('hexagonal');
  });

  test('sanitizeAnalysisPayload usa el apiKey de sesion y valida Azure DevOps', () => {
    const payload = sanitizeAnalysisPayload({
      requestId: 'req-azure',
      source: {
        provider: 'azure-devops',
        organization: 'acme',
        project: 'platform-team',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
        targetReviewer: ' review@example.com ',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: '   ',
      analysisDepth: 'standard',
      maxFilesPerRun: 2,
      includeTests: false,
      timeoutMs: 1000,
      promptDirectives: {
        architectureReviewEnabled: 1,
        requiredPractices: 'x'.repeat(2500),
      },
    }, 'sk-session');

    expect(payload.apiKey).toBe('sk-session');
    expect(payload.timeoutMs).toBe(15000);
    expect(payload.maxFilesPerRun).toBe(10);
    expect(payload.source.targetReviewer).toBe('review@example.com');
    expect(payload.promptDirectives.requiredPractices).toHaveLength(2000);

    expect(() => sanitizeAnalysisPayload({
      requestId: 'req-invalid-azure',
      source: {
        provider: 'azure-devops',
        organization: 'acme',
        project: '   ',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      analysisDepth: 'standard',
    }, 'sk-session')).toThrow('Azure DevOps requiere un project valido para ejecutar el analisis.');
  });

  test('registerAnalysisIpc registra run y cancel', async () => {
    const repositoryAnalysisService = {
      previewSnapshot: jest.fn().mockResolvedValue({ repository: 'repo-a' }),
      runAnalysis: jest.fn().mockResolvedValue({ summary: 'ok' }),
      cancelAnalysis: jest.fn(),
    };
    const pullRequestAnalysisService = {
      previewBatch: jest.fn().mockResolvedValue([]),
      analyzeBatch: jest.fn().mockResolvedValue([]),
      cancelAnalysis: jest.fn(),
    };
    const sessionSecretsStore = {
      get: jest.fn().mockReturnValue('sk-session'),
    };

    registerAnalysisIpc(repositoryAnalysisService, pullRequestAnalysisService, sessionSecretsStore);

    expect(registerHandle).toHaveBeenCalledTimes(6);
    const previewHandler = registerHandle.mock.calls[0][1];
    const runHandler = registerHandle.mock.calls[1][1];
    const cancelHandler = registerHandle.mock.calls[2][1];
    const prAiPreviewHandler = registerHandle.mock.calls[3][1];
    const prAiHandler = registerHandle.mock.calls[4][1];
    const prAiCancelHandler = registerHandle.mock.calls[5][1];

    await previewHandler({
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
      maxFilesPerRun: 50,
      includeTests: false,
      timeoutMs: 90000,
    });
    await runHandler({
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
      apiKey: 'sk',
      analysisDepth: 'standard',
      maxFilesPerRun: 50,
      includeTests: false,
      timeoutMs: 90000,
    });
    await cancelHandler('req-1');
    await prAiPreviewHandler({
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      apiKey: '',
      model: 'gpt-5.2-codex',
      analysisDepth: 'standard',
      snapshotPolicy: {
        excludedPathPatterns: '.env',
        strictMode: false,
      },
      promptDirectives: {
        focusAreas: 'seguridad',
        customInstructions: 'prioriza auth',
      },
      items: [
        {
          pullRequest: {
            id: '123',
          },
        },
      ],
    });
    await prAiHandler({
      source: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
      requestId: 'pr-ai-1',
      timeoutMs: 90000,
      apiKey: '',
      model: 'gpt-5.2-codex',
      analysisDepth: 'standard',
      snapshotPolicy: {
        excludedPathPatterns: '.env',
        strictMode: false,
      },
      promptDirectives: {
        focusAreas: 'seguridad',
        customInstructions: 'prioriza auth',
      },
      items: [
        {
          pullRequest: {
            id: '123',
            title: 'Actualizar auth',
            repository: 'repo-a',
            author: 'Ian',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceBranch: 'feature/auth',
            targetBranch: 'main',
            url: 'https://example.com/pr/123',
            status: 'active',
            isDraft: false,
            mergeStatus: 'succeeded',
            reviewers: [],
          },
        },
      ],
    });
    await prAiCancelHandler('pr-ai-1');

    expect(repositoryAnalysisService.previewSnapshot).toHaveBeenCalled();
    expect(repositoryAnalysisService.runAnalysis).toHaveBeenCalled();
    expect(repositoryAnalysisService.cancelAnalysis).toHaveBeenCalledWith('req-1');
    expect(pullRequestAnalysisService.previewBatch).toHaveBeenCalled();
    expect(pullRequestAnalysisService.analyzeBatch).toHaveBeenCalled();
    expect(pullRequestAnalysisService.cancelAnalysis).toHaveBeenCalledWith('pr-ai-1');
  });

  test('sanitizePullRequestAnalysisPayload normaliza source y items', () => {
    const payload = sanitizePullRequestAnalysisPayload({
      source: {
        provider: 'github',
        organization: ' acme ',
        project: ' repo-a ',
        repositoryId: ' repo-a ',
        personalAccessToken: ' pat ',
      },
      apiKey: ' sk ',
      model: ' gpt-5.2-codex ',
      analysisDepth: 'deep',
      snapshotPolicy: {
        excludedPathPatterns: '.env\n*.pem',
        strictMode: true,
      },
      promptDirectives: {
        focusAreas: ' arquitectura ',
        customInstructions: ' revisar auth ',
      },
      items: [
        {
          pullRequest: {
            id: 'abc',
          },
        },
        null,
      ],
    });

    expect(payload.source.organization).toBe('acme');
    expect(payload.apiKey).toBe('sk');
    expect(payload.model).toBe('gpt-5.2-codex');
    expect(payload.analysisDepth).toBe('deep');
    expect(payload.snapshotPolicy.strictMode).toBe(true);
    expect(payload.promptDirectives.focusAreas).toBe('arquitectura');
    expect(payload.items).toHaveLength(1);
  });

  test('sanitizePullRequestAnalysisPayload aplica fallbacks y recorta prompt directives', () => {
    const payload = sanitizePullRequestAnalysisPayload({
      requestId: '  req-pr  ',
      source: {
        provider: 'gitlab',
        organization: ' acme ',
        project: ' ',
        repositoryId: ' repo-a ',
        personalAccessToken: ' pat ',
      },
      apiKey: '',
      model: ' gpt-5.2-codex ',
      analysisDepth: 'whatever',
      timeoutMs: 999999,
      promptDirectives: {
        focusAreas: 'x'.repeat(2500),
        customInstructions: 'y'.repeat(3000),
      },
      items: [{ invalid: true }],
    }, 'sk-session');

    expect(payload.requestId).toBe('req-pr');
    expect(payload.apiKey).toBe('sk-session');
    expect(payload.analysisDepth).toBe('standard');
    expect(payload.timeoutMs).toBe(120000);
    expect(payload.promptDirectives.focusAreas).toHaveLength(2000);
    expect(payload.promptDirectives.customInstructions).toHaveLength(2500);
    expect(payload.items).toEqual([]);
  });

  test('analysis.shared helpers validan campos y normalizan policy', () => {
    expect(analysisShared.readRequiredString('  value  ', 'field')).toBe('value');
    expect(() => analysisShared.readRequiredString('   ', 'field')).toThrow('field es obligatorio.');
    expect(analysisShared.normalizeProvider('github', 'provider')).toBe('github');
    expect(() => analysisShared.normalizeProvider('bitbucket', 'provider')).toThrow('provider no es valido.');
    expect(analysisShared.normalizeOptionalString('  reviewer  ')).toBe('reviewer');
    expect(analysisShared.normalizeOptionalString('   ')).toBeUndefined();
    expect(analysisShared.clampNumber('45.8', 10, 50, 20)).toBe(45);
    expect(analysisShared.clampNumber('nope', 10, 50, 20)).toBe(20);
    expect(analysisShared.readSnapshotPolicy({
      excludedPathPatterns: 'x'.repeat(5000),
      strictMode: 'truthy',
    })).toEqual({
      excludedPathPatterns: 'x'.repeat(4000),
      strictMode: true,
    });
  });
});
