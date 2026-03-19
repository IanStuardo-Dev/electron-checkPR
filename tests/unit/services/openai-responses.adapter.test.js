const { OpenAIResponsesAdapter } = require('../../../src/services/analysis/openai-responses.adapter');

describe('openai responses adapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('construye el payload json_schema para la Responses API', async () => {
    const adapter = new OpenAIResponsesAdapter();
    global.fetch = jest.fn().mockResolvedValue(new Response('{"ok":true}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const result = await adapter.createJsonSchemaResponse({
      apiKey: 'sk-test',
      model: 'gpt-5.2-codex',
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'demo_schema',
      schema: { type: 'object' },
      signal: new AbortController().signal,
    });

    expect(result.rawText).toBe('{"ok":true}');
    expect(result.response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/responses', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer sk-test',
        'Content-Type': 'application/json',
      }),
    }));

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload.model).toBe('gpt-5.2-codex');
    expect(payload.input[0].content[0].text).toBe('system');
    expect(payload.input[1].content[0].text).toBe('user');
    expect(payload.text.format).toEqual({
      type: 'json_schema',
      name: 'demo_schema',
      schema: { type: 'object' },
      strict: true,
    });
  });
});
