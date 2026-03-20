import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview } from '../../types/analysis';
import type {
  PullRequestAnalysisClientPort,
  PullRequestAnalysisPromptBuilderPort,
  PullRequestAnalysisResponseParserPort,
  PullRequestAnalysisSnapshotProviderPort,
} from './pull-request-analysis.ports';
import { buildPullRequestAnalysisPreview } from './pull-request-analysis.preview';

export interface PullRequestAnalysisItemAnalyzerDependencies {
  snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  promptBuilder: PullRequestAnalysisPromptBuilderPort;
  analysisClient: PullRequestAnalysisClientPort;
  responseParser: PullRequestAnalysisResponseParserPort;
}

export interface PullRequestAnalysisItemRunContext {
  onControllerCreated?: (controller: AbortController) => void;
  onControllerDisposed?: (controller: AbortController) => void;
}

const DEFAULT_ITEM_ANALYSIS_TIMEOUT_MS = 60_000;

export class PullRequestAnalysisItemAnalyzer {
  private readonly snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  private readonly promptBuilder: PullRequestAnalysisPromptBuilderPort;
  private readonly analysisClient: PullRequestAnalysisClientPort;
  private readonly responseParser: PullRequestAnalysisResponseParserPort;

  constructor({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  }: PullRequestAnalysisItemAnalyzerDependencies) {
    this.snapshotProvider = snapshotProvider;
    this.promptBuilder = promptBuilder;
    this.analysisClient = analysisClient;
    this.responseParser = responseParser;
  }

  async analyzeItem(
    request: PullRequestAnalysisBatchRequest,
    item: PullRequestAnalysisBatchRequest['items'][number],
    runContext: PullRequestAnalysisItemRunContext = {},
  ): Promise<PullRequestAiReview> {
    const snapshot = await this.snapshotProvider.getSnapshot(request.source, item.pullRequest, request.snapshotPolicy);
    const preview = buildPullRequestAnalysisPreview(snapshot, Boolean(request.snapshotPolicy?.strictMode));

    if (preview.lacksPatchCoverage) {
      return this.toOmittedReview(item, preview.partialReason || preview.sensitivity.summary);
    }

    if (preview.strictModeWouldBlock) {
      return this.toOmittedReview(item, this.buildStrictModeCoverageNote(preview));
    }

    const prompt = this.promptBuilder.build(request, snapshot);
    const timeoutMs = request.timeoutMs ?? DEFAULT_ITEM_ANALYSIS_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
    runContext.onControllerCreated?.(controller);

    try {
      const rawText = await this.analysisClient.analyze({ request, prompt, signal: controller.signal });
      const parsed = this.responseParser.parse(rawText);

      return {
        pullRequestId: item.pullRequest.id,
        repository: item.pullRequest.repository,
        status: 'analyzed',
        riskScore: Math.max(0, Math.min(100, Math.round(parsed.riskScore))),
        shortSummary: parsed.shortSummary,
        topConcerns: parsed.topConcerns,
        reviewChecklist: parsed.reviewChecklist,
        coverageNote: snapshot.partialReason,
      };
    } catch (error) {
      return {
        pullRequestId: item.pullRequest.id,
        repository: item.pullRequest.repository,
        status: 'error',
        topConcerns: [],
        reviewChecklist: [],
        error: error instanceof Error
          ? error.message
          : 'No fue posible analizar el PR.',
      };
    } finally {
      clearTimeout(timeoutId);
      runContext.onControllerDisposed?.(controller);
    }
  }

  private toOmittedReview(
    item: PullRequestAnalysisBatchRequest['items'][number],
    coverageNote: string,
  ): PullRequestAiReview {
    return {
      pullRequestId: item.pullRequest.id,
      repository: item.pullRequest.repository,
      status: 'omitted',
      topConcerns: [],
      reviewChecklist: [],
      coverageNote,
    };
  }

  private buildStrictModeCoverageNote(preview: PullRequestAnalysisPreview): string {
    const blockedBySensitiveConfig = preview.sensitivity.hasSensitiveConfigFiles && !preview.sensitivity.hasSecretPatterns;
    return preview.lacksPatchCoverage
      ? 'PR omitido por modo estricto: el snapshot no incluye diff textual suficiente para una revision segura.'
      : blockedBySensitiveConfig
        ? 'PR omitido por modo estricto: se detectaron archivos potencialmente sensibles y la cobertura del diff es incompleta.'
        : 'PR omitido por modo estricto y señales sensibles en el diff.';
  }
}
