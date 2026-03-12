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
    const service = new PullRequestAnalysisService(snapshotProvider, promptBuilder, analysisClient, responseParser);

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
    const service = new PullRequestAnalysisService(snapshotProvider, promptBuilder, analysisClient, responseParser);

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
});
