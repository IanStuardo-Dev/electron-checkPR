import type { PullRequestAnalysisBatchRequest } from '../../types/analysis';
import { retryWithBackoff } from '../../shared/request-control';
import { OpenAIResponsesAdapter } from './openai-responses.adapter';
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
  constructor(
    private readonly responsesAdapter: OpenAIResponsesAdapter = new OpenAIResponsesAdapter(),
  ) {}

  async analyze(input: {
    request: PullRequestAnalysisBatchRequest;
    prompt: PullRequestAnalysisPromptPayload;
    signal: AbortSignal;
  }): Promise<string> {
    return retryWithBackoff(async () => {
      const { response, rawText } = await this.responsesAdapter.createJsonSchemaResponse({
        apiKey: input.request.apiKey,
        model: input.request.model,
        systemPrompt: input.prompt.systemPrompt,
        userPrompt: input.prompt.userPrompt,
        schemaName: 'pull_request_analysis',
        schema: PULL_REQUEST_ANALYSIS_SCHEMA,
        signal: input.signal,
      });
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
