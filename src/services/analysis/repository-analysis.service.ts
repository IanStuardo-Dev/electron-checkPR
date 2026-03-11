import type {
  RepositoryAnalysisFinding,
  RepositoryAnalysisPromptDirectives,
  RepositoryAnalysisRequest,
  RepositoryAnalysisResult,
} from '../../types/analysis';
import { getRepositoryProviderPort } from '../providers/repository-provider.registry';

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

interface ActiveAnalysisRun {
  cancelled: boolean;
  controller: AbortController | null;
  timeoutId: NodeJS.Timeout | null;
}

const DEFAULT_ANALYSIS_TIMEOUT_MS = 90_000;

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

function buildPromptDirectiveSection(promptDirectives?: RepositoryAnalysisPromptDirectives): string {
  if (!promptDirectives) {
    return '';
  }

  const sections: string[] = [];

  if (promptDirectives.architectureReviewEnabled) {
    sections.push('Architecture review is explicitly required.');
  }

  if (promptDirectives.architecturePattern) {
    sections.push(`The repository should be evaluated against this architecture or design style: ${promptDirectives.architecturePattern}.`);
  }

  if (promptDirectives.requiredPractices) {
    sections.push(`Required practices to verify:\n${promptDirectives.requiredPractices}`);
  }

  if (promptDirectives.forbiddenPractices) {
    sections.push(`Practices or anti-patterns that must be flagged:\n${promptDirectives.forbiddenPractices}`);
  }

  if (promptDirectives.domainContext) {
    sections.push(`Domain context for the analysis:\n${promptDirectives.domainContext}`);
  }

  if (promptDirectives.customInstructions) {
    sections.push(`Additional reviewer instructions:\n${promptDirectives.customInstructions}`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `Analysis policies configured by the user:\n${sections.join('\n\n')}`;
}

export class RepositoryAnalysisService {
  private activeRuns = new Map<string, ActiveAnalysisRun>();

  constructor(
    private readonly providerResolver: typeof getRepositoryProviderPort = getRepositoryProviderPort,
  ) {}

  async runAnalysis(request: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResult> {
    if (!request.apiKey.trim()) {
      throw new Error('La API key de Codex es obligatoria para ejecutar el analisis.');
    }

    this.activeRuns.set(request.requestId, {
      cancelled: false,
      controller: null,
      timeoutId: null,
    });

    const snapshot = await this.getSnapshot(request);
    this.assertRunNotCancelled(request.requestId);
    if (snapshot.files.length === 0) {
      this.cleanupRun(request.requestId);
      throw new Error('No se encontraron archivos de codigo legibles para analizar en el scope seleccionado.');
    }

    const systemPrompt = [
      'You are a senior staff engineer performing repository analysis for maintainability, security, architecture, performance and testing.',
      'Return concise, actionable findings only.',
      'Base the analysis strictly on the provided repository snapshot.',
      'Prefer high-signal issues over exhaustive low-value nitpicks.',
      'Respond in Spanish.',
      'All fields in the structured output must be written in Spanish, including summary, concerns, recommendations, titles and details.',
    ].join(' ');

    const userPrompt = [
      `Provider: ${snapshot.provider}`,
      `Repository: ${snapshot.repository}`,
      `Branch: ${snapshot.branch}`,
      `Files analyzed: ${snapshot.files.length}/${snapshot.totalFilesDiscovered}`,
      `Analysis depth: ${request.analysisDepth}`,
      buildPromptDirectiveSection(request.promptDirectives),
      '',
      'Repository snapshot:',
      snapshot.files.map((file) => (
        `FILE: ${file.path}\nSIZE: ${file.size}\nCONTENT:\n${file.content.slice(0, 12000)}`
      )).join('\n\n---\n\n'),
    ].join('\n');

    const timeoutMs = request.timeoutMs ?? DEFAULT_ANALYSIS_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
    const activeRun = this.activeRuns.get(request.requestId);
    if (activeRun) {
      activeRun.controller = controller;
      activeRun.timeoutId = timeoutId;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: request.model,
          store: false,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: systemPrompt }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: userPrompt }],
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

      return {
        provider: request.source.provider,
        repository: snapshot.repository,
        branch: request.branchName,
        model: request.model,
        analyzedAt: new Date().toISOString(),
        summary: analysis.summary,
        score: Math.max(0, Math.min(100, Math.round(analysis.score))),
        riskLevel: analysis.riskLevel,
        topConcerns: analysis.topConcerns,
        recommendations: analysis.recommendations,
        findings: analysis.findings,
        snapshot: {
          totalFilesDiscovered: snapshot.totalFilesDiscovered,
          filesAnalyzed: snapshot.files.length,
          truncated: snapshot.truncated,
          partialReason: snapshot.partialReason,
          durationMs: snapshot.metrics?.durationMs,
          retryCount: snapshot.metrics?.retryCount,
          discardedByPrioritization: snapshot.metrics?.discardedByPrioritization,
          discardedBySize: snapshot.metrics?.discardedBySize,
          discardedByBinaryDetection: snapshot.metrics?.discardedByBinaryDetection,
        },
      };
    } catch (error) {
      if (controller.signal.aborted) {
        if (controller.signal.reason === 'timeout') {
          throw new Error(`El analisis remoto excedio el timeout de ${Math.round(timeoutMs / 1000)} segundos. Reintenta o reduce el scope.`);
        }

        throw new Error('El analisis fue cancelado antes de completarse.');
      }

      throw error;
    } finally {
      this.cleanupRun(request.requestId);
    }
  }

  cancelAnalysis(requestId: string): void {
    const activeRun = this.activeRuns.get(requestId);
    if (!activeRun) {
      return;
    }

    activeRun.cancelled = true;
    activeRun.controller?.abort('cancelled');
    this.cleanupRun(requestId);
  }

  private async getSnapshot(request: RepositoryAnalysisRequest) {
    const provider = this.providerResolver(request.source.provider);
    const sourceConfig = {
      ...request.source,
      repositoryId: request.repositoryId,
      project: request.source.provider === 'azure-devops'
        ? request.source.project
        : request.repositoryId || request.source.project,
    };

    const options = {
      branchName: request.branchName,
      maxFiles: request.maxFilesPerRun,
      includeTests: request.includeTests,
    };

    return provider.getRepositorySnapshot(sourceConfig, options);
  }

  private assertRunNotCancelled(requestId: string): void {
    if (this.activeRuns.get(requestId)?.cancelled) {
      this.cleanupRun(requestId);
      throw new Error('El analisis fue cancelado antes de iniciar la consulta remota.');
    }
  }

  private cleanupRun(requestId: string): void {
    const activeRun = this.activeRuns.get(requestId);
    if (!activeRun) {
      return;
    }

    if (activeRun.timeoutId) {
      clearTimeout(activeRun.timeoutId);
    }

    this.activeRuns.delete(requestId);
  }
}

export const repositoryAnalysisService = new RepositoryAnalysisService();
