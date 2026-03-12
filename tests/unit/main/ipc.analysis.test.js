jest.mock('../../../src/main/ipc/shared', () => ({
  registerHandle: jest.fn(),
}));

const { registerHandle } = require('../../../src/main/ipc/shared');
const {
  sanitizeAnalysisPayload,
  sanitizePullRequestAnalysisPayload,
  registerAnalysisIpc,
} = require('../../../src/main/ipc/analysis');

describe('analysis ipc', () => {
  beforeEach(() => {
    registerHandle.mockReset();
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

  test('registerAnalysisIpc registra run y cancel', async () => {
    const repositoryAnalysisService = {
      previewSnapshot: jest.fn().mockResolvedValue({ repository: 'repo-a' }),
      runAnalysis: jest.fn().mockResolvedValue({ summary: 'ok' }),
      cancelAnalysis: jest.fn(),
    };
    const pullRequestAnalysisService = {
      previewBatch: jest.fn().mockResolvedValue([]),
      analyzeBatch: jest.fn().mockResolvedValue([]),
    };

    registerAnalysisIpc(repositoryAnalysisService, pullRequestAnalysisService);

    expect(registerHandle).toHaveBeenCalledTimes(5);
    const previewHandler = registerHandle.mock.calls[0][1];
    const runHandler = registerHandle.mock.calls[1][1];
    const cancelHandler = registerHandle.mock.calls[2][1];
    const prAiPreviewHandler = registerHandle.mock.calls[3][1];
    const prAiHandler = registerHandle.mock.calls[4][1];

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
      apiKey: 'sk',
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
      apiKey: 'sk',
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

    expect(repositoryAnalysisService.previewSnapshot).toHaveBeenCalled();
    expect(repositoryAnalysisService.runAnalysis).toHaveBeenCalled();
    expect(repositoryAnalysisService.cancelAnalysis).toHaveBeenCalledWith('req-1');
    expect(pullRequestAnalysisService.previewBatch).toHaveBeenCalled();
    expect(pullRequestAnalysisService.analyzeBatch).toHaveBeenCalled();
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
});
