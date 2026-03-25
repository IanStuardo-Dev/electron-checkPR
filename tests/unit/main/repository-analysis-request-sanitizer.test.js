const {
  sanitizeRepositoryAnalysisPayload,
} = require('../../../src/modules/runtime-host/application/analysis/services/repository-analysis-request-sanitizer.service');

function createPayload(overrides = {}) {
  return {
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
    apiKey: '',
    analysisDepth: 'standard',
    maxFilesPerRun: 999,
    timeoutMs: 999_999,
    ...overrides,
  };
}

describe('repository analysis payload sanitizer', () => {
  test('normaliza limites y usa api key de sesion cuando no llega en payload', () => {
    const payload = sanitizeRepositoryAnalysisPayload(createPayload(), 'sk-session');

    expect(payload.maxFilesPerRun).toBe(200);
    expect(payload.timeoutMs).toBe(120000);
    expect(payload.apiKey).toBe('sk-session');
  });

  test('azure devops requiere project valido', () => {
    expect(() => sanitizeRepositoryAnalysisPayload(createPayload({
      source: {
        provider: 'azure-devops',
        organization: 'acme',
        project: ' ',
        repositoryId: 'repo-a',
        personalAccessToken: 'pat',
      },
    }), 'sk-session')).toThrow('Azure DevOps requiere un project valido para ejecutar el analisis.');
  });

  test('rechaza payloads sin fuente', () => {
    expect(() => sanitizeRepositoryAnalysisPayload({
      requestId: 'req-1',
      repositoryId: 'repo-a',
      branchName: 'main',
      model: 'gpt-5.2-codex',
      apiKey: 'sk',
    })).toThrow('La fuente del analisis es obligatoria.');
  });
});
