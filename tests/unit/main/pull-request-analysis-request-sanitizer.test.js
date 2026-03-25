const {
  sanitizePullRequestAnalysisPayload,
} = require('../../../src/modules/runtime-host/application/analysis/services/pull-request-analysis-request-sanitizer.service');

function createPayload(overrides = {}) {
  return {
    requestId: 'req-pr',
    source: {
      provider: 'github',
      organization: 'acme',
      project: 'repo-a',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    },
    apiKey: '',
    model: 'gpt-5.2-codex',
    analysisDepth: 'deep',
    timeoutMs: 60_000,
    items: [
      { pullRequest: { id: 1, repository: 'repo-a' } },
      { pullRequest: { id: 2, repository: 'repo-a' } },
      { pullRequest: { id: 3, repository: 'repo-a' } },
    ],
    ...overrides,
  };
}

describe('pull request analysis payload sanitizer', () => {
  test('aplica limites configurables de items y concurrencia', () => {
    const payload = sanitizePullRequestAnalysisPayload(createPayload({
      maxItems: 2,
      previewConcurrency: 99,
      analysisConcurrency: 0,
    }), 'sk-session');

    expect(payload.maxItems).toBe(2);
    expect(payload.previewConcurrency).toBe(8);
    expect(payload.analysisConcurrency).toBe(2);
    expect(payload.items).toHaveLength(2);
    expect(payload.apiKey).toBe('sk-session');
  });

  test('usa fallback seguro cuando maxItems viene invalido', () => {
    const payload = sanitizePullRequestAnalysisPayload(createPayload({
      maxItems: 'not-a-number',
      items: [
        { pullRequest: { id: 1, repository: 'repo-a' } },
        { notPullRequest: true },
      ],
    }), 'sk-session');

    expect(payload.maxItems).toBe(1);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].pullRequest.id).toBe(1);
  });

  test('rechaza payloads sin fuente', () => {
    expect(() => sanitizePullRequestAnalysisPayload({
      model: 'gpt-5.2-codex',
      apiKey: 'sk-live',
      items: [],
    })).toThrow('La fuente del PR analysis es obligatoria.');
  });
});
