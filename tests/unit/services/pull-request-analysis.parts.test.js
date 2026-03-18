const { PullRequestAnalysisPromptBuilder } = require('../../../src/services/analysis/pull-request-analysis.prompt-builder');
const { PullRequestAnalysisResponseParser } = require('../../../src/services/analysis/pull-request-analysis.response-parser');
const { OpenAIPullRequestAnalysisClient } = require('../../../src/services/analysis/pull-request-analysis.openai-client');
const { PullRequestAnalysisSnapshotProvider } = require('../../../src/services/analysis/pull-request-analysis.snapshot-provider');

describe('pull request analysis parts', () => {
  test('prompt builder incluye directivas y metadata del PR', () => {
    const builder = new PullRequestAnalysisPromptBuilder();
    const prompt = builder.build({
      analysisDepth: 'deep',
      promptDirectives: {
        focusAreas: 'seguridad\nautenticacion',
        customInstructions: 'priorizar regresiones',
      },
    }, {
      provider: 'github',
      repository: 'repo-a',
      pullRequestId: 42,
      title: 'Actualizar auth',
      description: 'Cambio de login',
      author: 'Ian',
      sourceBranch: 'feature/auth',
      targetBranch: 'main',
      reviewers: [{ displayName: 'Ana', vote: 10 }],
      files: [{ path: 'src/auth.ts', status: 'modified', patch: '+ const enabled = true;' }],
      totalFilesChanged: 1,
      partialReason: 'snapshot parcial',
    });

    expect(prompt.systemPrompt).toMatch(/Respond in Spanish/i);
    expect(prompt.userPrompt).toMatch(/Focus areas that must be prioritized/i);
    expect(prompt.userPrompt).toMatch(/priorizar regresiones/i);
    expect(prompt.userPrompt).toMatch(/PR: #42/);
    expect(prompt.userPrompt).toMatch(/snapshot parcial/);
  });

  test('response parser acepta payload estructurado en raiz y output_text', () => {
    const parser = new PullRequestAnalysisResponseParser();

    expect(parser.parse(JSON.stringify({
      riskScore: 77,
      shortSummary: 'Resumen',
      topConcerns: ['a'],
      reviewChecklist: ['b'],
    }))).toMatchObject({ riskScore: 77, shortSummary: 'Resumen' });

    expect(parser.parse(JSON.stringify({
      output_text: JSON.stringify({
        riskScore: 55,
        shortSummary: 'Desde output_text',
        topConcerns: ['x'],
        reviewChecklist: ['y'],
      }),
    }))).toMatchObject({ riskScore: 55, shortSummary: 'Desde output_text' });
  });

  test('response parser acepta payload estructurado dentro de output content', () => {
    const parser = new PullRequestAnalysisResponseParser();

    expect(parser.parse(JSON.stringify({
      output: [
        {
          content: [
            { text: 'not-json' },
            {
              text: JSON.stringify({
                riskScore: 42,
                shortSummary: 'Desde content',
                topConcerns: ['auth'],
                reviewChecklist: ['tests'],
              }),
            },
          ],
        },
      ],
    }))).toMatchObject({
      riskScore: 42,
      shortSummary: 'Desde content',
      topConcerns: ['auth'],
      reviewChecklist: ['tests'],
    });
  });

  test('response parser falla con payload invalido', () => {
    const parser = new PullRequestAnalysisResponseParser();
    expect(() => parser.parse('not-json')).toThrow(/respuesta invalida/i);
    expect(() => parser.parse(JSON.stringify({ foo: 'bar' }))).toThrow(/no devolvio salida estructurada/i);
    expect(() => parser.parse(JSON.stringify({
      output_text: '{"riskScore":"bad"}',
      output: [
        {
          content: [
            { text: '' },
            { text: '{"riskScore":12}' },
          ],
        },
      ],
    }))).toThrow(/no devolvio salida estructurada/i);
  });

  test('openai client reintenta 429 y envia schema json', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'rate limit',
        statusText: 'Too Many Requests',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '{"ok":true}',
      });

    const client = new OpenAIPullRequestAnalysisClient();
    const signal = new AbortController().signal;
    const result = await client.analyze({
      request: {
        apiKey: 'sk-test',
        model: 'gpt-5.2-codex',
      },
      prompt: {
        systemPrompt: 'system',
        userPrompt: 'user',
      },
      signal,
    });

    expect(result).toBe('{"ok":true}');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const lastCall = global.fetch.mock.calls[1];
    expect(lastCall[1].headers.Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(lastCall[1].body).text.format.name).toBe('pull_request_analysis');

    global.fetch = originalFetch;
  });

  test('openai client no reintenta si el signal ya fue abortado', async () => {
    const originalFetch = global.fetch;
    const controller = new AbortController();
    controller.abort();
    global.fetch = jest.fn().mockRejectedValue(new Error('Codex PR analysis failed (500): aborted upstream'));

    const client = new OpenAIPullRequestAnalysisClient();

    await expect(client.analyze({
      request: {
        apiKey: 'sk-test',
        model: 'gpt-5.2-codex',
      },
      prompt: {
        systemPrompt: 'system',
        userPrompt: 'user',
      },
      signal: controller.signal,
    })).rejects.toThrow('Codex PR analysis failed (500): aborted upstream');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    global.fetch = originalFetch;
  });

  test('openai client no reintenta errores que no son instancias de Error', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue('boom');
    const client = new OpenAIPullRequestAnalysisClient();

    await expect(client.analyze({
      request: {
        apiKey: 'sk-test',
        model: 'gpt-5.2-codex',
      },
      prompt: {
        systemPrompt: 'system',
        userPrompt: 'user',
      },
      signal: new AbortController().signal,
    })).rejects.toBe('boom');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    global.fetch = originalFetch;
  });

  test('openai client usa statusText cuando la respuesta de error llega vacia', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '',
      statusText: 'Bad Request',
    });
    const client = new OpenAIPullRequestAnalysisClient();

    await expect(client.analyze({
      request: {
        apiKey: 'sk-test',
        model: 'gpt-5.2-codex',
      },
      prompt: {
        systemPrompt: 'system',
        userPrompt: 'user',
      },
      signal: new AbortController().signal,
    })).rejects.toThrow('Codex PR analysis failed (400): Bad Request');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    global.fetch = originalFetch;
  });

  test('snapshot provider delega al registry con excludedPathPatterns', async () => {
    const provider = {
      getPullRequestSnapshot: jest.fn().mockResolvedValue({ repository: 'repo-a' }),
    };
    const registry = {
      get: jest.fn().mockReturnValue(provider),
    };
    const snapshotProvider = new PullRequestAnalysisSnapshotProvider(registry);

    await snapshotProvider.getSnapshot(
      { provider: 'github', organization: 'acme', project: 'repo-a', personalAccessToken: 'pat' },
      { id: 42, repository: 'repo-a' },
      { excludedPathPatterns: '.env', strictMode: true },
    );

    expect(registry.get).toHaveBeenCalledWith('github');
    expect(provider.getPullRequestSnapshot).toHaveBeenCalledWith(
      { provider: 'github', organization: 'acme', project: 'repo-a', personalAccessToken: 'pat' },
      { id: 42, repository: 'repo-a' },
      { excludedPathPatterns: '.env' },
    );
  });
});
