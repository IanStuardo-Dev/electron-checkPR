jest.mock('../../../src/main/ipc/shared', () => ({
  registerHandle: jest.fn(),
}));

const { registerHandle } = require('../../../src/main/ipc/shared');
const { sanitizeAnalysisPayload, registerAnalysisIpc } = require('../../../src/main/ipc/analysis');

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
      timeoutMs: 999999,
      promptDirectives: {
        architectureReviewEnabled: true,
        architecturePattern: 'hexagonal',
      },
    });

    expect(payload.maxFilesPerRun).toBe(200);
    expect(payload.timeoutMs).toBe(120000);
    expect(payload.source.organization).toBe('acme');
    expect(payload.promptDirectives.architecturePattern).toBe('hexagonal');
  });

  test('registerAnalysisIpc registra run y cancel', async () => {
    const repositoryAnalysisService = {
      runAnalysis: jest.fn().mockResolvedValue({ summary: 'ok' }),
      cancelAnalysis: jest.fn(),
    };

    registerAnalysisIpc(repositoryAnalysisService);

    expect(registerHandle).toHaveBeenCalledTimes(2);
    const runHandler = registerHandle.mock.calls[0][1];
    const cancelHandler = registerHandle.mock.calls[1][1];

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

    expect(repositoryAnalysisService.runAnalysis).toHaveBeenCalled();
    expect(repositoryAnalysisService.cancelAnalysis).toHaveBeenCalledWith('req-1');
  });
});
