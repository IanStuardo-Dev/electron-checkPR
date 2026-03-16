import type { PullRequestAnalysisResponseParserPort } from './pull-request-analysis.ports';

interface OpenAIResponsesResult {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}

interface StructuredPullRequestAnalysis {
  riskScore: number;
  shortSummary: string;
  topConcerns: string[];
  reviewChecklist: string[];
}

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isStructuredPullRequestAnalysis(value: unknown): value is StructuredPullRequestAnalysis {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<StructuredPullRequestAnalysis>;
  return typeof payload.riskScore === 'number'
    && typeof payload.shortSummary === 'string'
    && Array.isArray(payload.topConcerns)
    && payload.topConcerns.every((item) => typeof item === 'string')
    && Array.isArray(payload.reviewChecklist)
    && payload.reviewChecklist.every((item) => typeof item === 'string');
}

export class PullRequestAnalysisResponseParser implements PullRequestAnalysisResponseParserPort {
  parse(rawText: string): StructuredPullRequestAnalysis {
    const parsed = tryParseJson<OpenAIResponsesResult>(rawText);
    if (!parsed) {
      throw new Error('Codex devolvio una respuesta invalida para el PR analysis.');
    }

    if (isStructuredPullRequestAnalysis(parsed)) {
      return parsed;
    }

    if (parsed.output_text) {
      const outputPayload = tryParseJson<unknown>(parsed.output_text);
      if (isStructuredPullRequestAnalysis(outputPayload)) {
        return outputPayload;
      }
    }

    const contentPayloads = (parsed.output || [])
      .flatMap((item) => item.content || [])
      .map((item) => item.text)
      .filter((item): item is string => Boolean(item))
      .map((item) => tryParseJson<unknown>(item))
      .find((item) => isStructuredPullRequestAnalysis(item));

    if (contentPayloads && isStructuredPullRequestAnalysis(contentPayloads)) {
      return contentPayloads;
    }

    throw new Error('Codex no devolvio salida estructurada para el PR analysis.');
  }
}
