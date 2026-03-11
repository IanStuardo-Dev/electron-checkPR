import type { RepositoryAnalysisRequest } from '../../types/analysis';
import type { AnalysisClientPort, AnalysisPromptPayload } from './repository-analysis.ports';

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'score', 'riskLevel', 'topConcerns', 'recommendations', 'findings'],
  properties: {
    summary: { type: 'string' },
    score: { type: 'number' },
    riskLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
    },
    topConcerns: {
      type: 'array',
      items: { type: 'string' },
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'severity', 'category', 'filePath', 'detail', 'recommendation'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          category: {
            type: 'string',
            enum: ['security', 'architecture', 'maintainability', 'performance', 'testing'],
          },
          filePath: { type: 'string' },
          detail: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
  },
} as const;

function compactText(value: string, maxLength = 2400): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export class OpenAIRepositoryAnalysisClient implements AnalysisClientPort {
  async analyze(input: {
    request: RepositoryAnalysisRequest;
    prompt: AnalysisPromptPayload;
    signal: AbortSignal;
  }): Promise<string> {
    const { request, prompt, signal } = input;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: request.model,
        store: false,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: prompt.systemPrompt }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt.userPrompt }],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'repository_analysis',
            schema: ANALYSIS_SCHEMA,
            strict: true,
          },
        },
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      const detail = compactText(rawText, 600) || response.statusText;

      if (response.status === 429 && rawText.includes('insufficient_quota')) {
        throw new Error(
          'Codex analysis failed (429): insufficient_quota.\nRevisa tu plan, billing o limites de uso en OpenAI antes de reintentar.\n\nResponse:\n'
          + detail,
        );
      }

      throw new Error(`Codex analysis failed (${response.status}): ${detail}`);
    }

    return rawText;
  }
}
