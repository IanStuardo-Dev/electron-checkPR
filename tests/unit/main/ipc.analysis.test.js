jest.mock('../../../src/main/ipc/shared', () => ({
  registerHandle: jest.fn(),
}));

jest.mock('../../../src/services/analysis/repository-analysis.service', () => ({
  repositoryAnalysisService: {
    runAnalysis: jest.fn(),
    cancelAnalysis: jest.fn(),
  },
}));

const { registerHandle } = require('../../../src/main/ipc/shared');
const { repositoryAnalysisService } = require('../../../src/services/analysis/repository-analysis.service');
const { sanitizeAnalysisPayload, registerAnalysisIpc } = require('../../../src/main/ipc/analysis');

describe('analysis ipc', () => {
  beforeEach(() => {
    registerHandle.mockReset();
    repositoryAnalysisService.runAnalysis.mockReset();
    repositoryAnalysisService.cancelAnalysis.mockReset();
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
    repositoryAnalysisService.runAnalysis.mockResolvedValue({ summary: 'ok' });
    registerAnalysisIpc();

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
