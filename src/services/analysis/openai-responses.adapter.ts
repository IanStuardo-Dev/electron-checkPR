export interface OpenAIResponsesJsonSchemaRequest {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: unknown;
  signal: AbortSignal;
}

export class OpenAIResponsesAdapter {
  async createJsonSchemaResponse(input: OpenAIResponsesJsonSchemaRequest): Promise<{
    response: Response;
    rawText: string;
  }> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      signal: input.signal,
      body: JSON.stringify({
        model: input.model,
        store: false,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: input.systemPrompt }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: input.userPrompt }],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: input.schemaName,
            schema: input.schema,
            strict: true,
          },
        },
      }),
    });

    return {
      response,
      rawText: await response.text(),
    };
  }
}
