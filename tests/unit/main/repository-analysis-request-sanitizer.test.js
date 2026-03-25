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

  test('rechaza providers no soportados', () => {
    expect(() => sanitizeRepositoryAnalysisPayload(createPayload({
      source: {
        ...createPayload().source,
        provider: 'bitbucket',
      },
    }), 'sk-session')).toThrow('El provider del analisis no es valido.');
  });

  test('normaliza limites de promptDirectives', () => {
    const payload = sanitizeRepositoryAnalysisPayload(createPayload({
      promptDirectives: {
        architectureReviewEnabled: 1,
        architecturePattern: 'a'.repeat(700),
        requiredPractices: 'r'.repeat(2500),
        forbiddenPractices: 'f'.repeat(2500),
        domainContext: 'd'.repeat(1800),
        customInstructions: 'c'.repeat(3000),
      },
    }), 'sk-session');

    expect(payload.promptDirectives.architectureReviewEnabled).toBe(true);
    expect(payload.promptDirectives.architecturePattern).toHaveLength(500);
    expect(payload.promptDirectives.requiredPractices).toHaveLength(2000);
    expect(payload.promptDirectives.forbiddenPractices).toHaveLength(2000);
    expect(payload.promptDirectives.domainContext).toHaveLength(1500);
    expect(payload.promptDirectives.customInstructions).toHaveLength(2500);
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
