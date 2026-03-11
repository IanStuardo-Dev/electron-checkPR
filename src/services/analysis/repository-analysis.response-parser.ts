import type { RepositoryAnalysisFinding, RepositoryAnalysisResult } from '../../types/analysis';
import type { AnalysisResponseParserPort } from './repository-analysis.ports';

interface OpenAIResponsesResult {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

type ParsedAnalysisPayload = Omit<
  RepositoryAnalysisResult,
  'provider' | 'repository' | 'branch' | 'model' | 'analyzedAt' | 'snapshot'
>;

function compactText(value: string, maxLength = 2400): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function extractResponseDebug(parsedResponse: OpenAIResponsesResult, rawText: string): string {
  const contentTexts = (parsedResponse.output || [])
    .flatMap((item) => item.content || [])
    .map((item) => item.text)
    .filter((item): item is string => Boolean(item))
    .join('\n\n');

  if (contentTexts.trim()) {
    return compactText(contentTexts);
  }

  return compactText(rawText);
}

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isValidFinding(value: unknown): value is RepositoryAnalysisFinding {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const finding = value as Partial<RepositoryAnalysisFinding>;
  return typeof finding.id === 'string'
    && typeof finding.title === 'string'
    && typeof finding.severity === 'string'
    && typeof finding.category === 'string'
    && typeof finding.filePath === 'string'
    && typeof finding.detail === 'string'
    && typeof finding.recommendation === 'string';
}

function isStructuredAnalysisPayload(value: unknown): value is ParsedAnalysisPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<ParsedAnalysisPayload>;
  return typeof payload.summary === 'string'
    && typeof payload.score === 'number'
    && typeof payload.riskLevel === 'string'
    && Array.isArray(payload.topConcerns)
    && payload.topConcerns.every((item) => typeof item === 'string')
    && Array.isArray(payload.recommendations)
    && payload.recommendations.every((item) => typeof item === 'string')
    && Array.isArray(payload.findings)
    && payload.findings.every(isValidFinding);
}

function extractStructuredPayload(
  parsedResponse: OpenAIResponsesResult,
  rawText: string,
): ParsedAnalysisPayload | null {
  if (isStructuredAnalysisPayload(parsedResponse)) {
    return parsedResponse;
  }

  if (parsedResponse.output_text) {
    const outputTextPayload = tryParseJson<unknown>(parsedResponse.output_text);
    if (isStructuredAnalysisPayload(outputTextPayload)) {
      return outputTextPayload;
    }
  }

  const contentTexts = (parsedResponse.output || [])
    .flatMap((item) => item.content || [])
    .map((item) => item.text)
    .filter((item): item is string => Boolean(item));

  for (const contentText of contentTexts) {
    const contentPayload = tryParseJson<unknown>(contentText);
    if (isStructuredAnalysisPayload(contentPayload)) {
      return contentPayload;
    }
  }

  const rawPayload = tryParseJson<unknown>(rawText);
  if (isStructuredAnalysisPayload(rawPayload)) {
    return rawPayload;
  }

  return null;
}

export class RepositoryAnalysisResponseParser implements AnalysisResponseParserPort {
  parse(rawText: string): ParsedAnalysisPayload {
    let parsedResponse: OpenAIResponsesResult;
    try {
      parsedResponse = JSON.parse(rawText) as OpenAIResponsesResult;
    } catch {
      throw new Error('Codex devolvio una respuesta invalida.');
    }

    const analysis = extractStructuredPayload(parsedResponse, rawText);

    if (!analysis) {
      throw new Error(
        'Codex no devolvio salida estructurada.\n\nRaw response:\n'
        + extractResponseDebug(parsedResponse, rawText),
      );
    }

    if (!isStructuredAnalysisPayload(analysis)) {
      throw new Error(
        'Codex devolvio una estructura incompleta para el reporte.\n\nRaw analysis:\n'
        + compactText(JSON.stringify(analysis), 2400),
      );
    }

    return analysis;
  }
}
