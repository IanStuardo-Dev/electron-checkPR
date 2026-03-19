import type { PullRequestAnalysisBatchRequest } from '../../types/analysis';
import { retryWithBackoff } from '../../shared/request-control';
import type { PullRequestAnalysisClientPort, PullRequestAnalysisPromptPayload } from './pull-request-analysis.ports';

const PULL_REQUEST_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['riskScore', 'shortSummary', 'topConcerns', 'reviewChecklist'],
  properties: {
    riskScore: { type: 'number' },
    shortSummary: { type: 'string' },
    topConcerns: {
      type: 'array',
      items: { type: 'string' },
    },
    reviewChecklist: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const;

export class OpenAIPullRequestAnalysisClient implements PullRequestAnalysisClientPort {
  async analyze(input: {
    request: PullRequestAnalysisBatchRequest;
    prompt: PullRequestAnalysisPromptPayload;
    signal: AbortSignal;
  }): Promise<string> {
    return retryWithBackoff(async () => {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.request.apiKey}`,
        },
        signal: input.signal,
        body: JSON.stringify({
          model: input.request.model,
          store: false,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: input.prompt.systemPrompt }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: input.prompt.userPrompt }],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'pull_request_analysis',
              schema: PULL_REQUEST_ANALYSIS_SCHEMA,
              strict: true,
            },
          },
        }),
      });

      const rawText = await response.text();
      if (!response.ok) {
        throw new Error(`Codex PR analysis failed (${response.status}): ${rawText.slice(0, 500) || response.statusText}`);
      }

      return rawText;
    }, {
      retries: 2,
      shouldRetry: (error) => {
        if (input.signal.aborted) {
          return false;
        }

        if (!(error instanceof Error)) {
          return false;
        }

        return /\((429|5\d\d)\)/.test(error.message);
      },
    });
  }
}
