import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview } from '../../types/analysis';
import { mapWithConcurrency } from '../../shared/request-control';
import type {
  PullRequestAnalysisClientPort,
  PullRequestAnalysisPromptBuilderPort,
  PullRequestAnalysisResponseParserPort,
  PullRequestAnalysisSnapshotProviderPort,
} from './pull-request-analysis.ports';
import { buildPullRequestAnalysisPreview } from './pull-request-analysis.preview';

interface PullRequestAnalysisServiceDependencies {
  snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  promptBuilder: PullRequestAnalysisPromptBuilderPort;
  analysisClient: PullRequestAnalysisClientPort;
  responseParser: PullRequestAnalysisResponseParserPort;
}

export class PullRequestAnalysisService {
  private activeRuns = new Map<string, Set<AbortController>>();
  private readonly snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  private readonly promptBuilder: PullRequestAnalysisPromptBuilderPort;
  private readonly analysisClient: PullRequestAnalysisClientPort;
  private readonly responseParser: PullRequestAnalysisResponseParserPort;

  constructor({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  }: PullRequestAnalysisServiceDependencies) {
    this.snapshotProvider = snapshotProvider;
    this.promptBuilder = promptBuilder;
    this.analysisClient = analysisClient;
    this.responseParser = responseParser;
  }

  async previewBatch(request: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]> {
    const previews: PullRequestAnalysisPreview[] = [];

    for (const item of request.items) {
      const snapshot = await this.snapshotProvider.getSnapshot(request.source, item.pullRequest, request.snapshotPolicy);
      previews.push(buildPullRequestAnalysisPreview(snapshot, Boolean(request.snapshotPolicy?.strictMode)));
    }

    return previews;
  }

  async analyzeBatch(request: PullRequestAnalysisBatchRequest): Promise<PullRequestAiReview[]> {
    if (!request.apiKey.trim()) {
      return request.items.map(({ pullRequest }) => ({
        pullRequestId: pullRequest.id,
        repository: pullRequest.repository,
        status: 'not-configured',
        topConcerns: [],
        reviewChecklist: [],
        coverageNote: 'Codex no configurado para PR AI review.',
      }));
    }

    const requestId = request.requestId?.trim();
    if (requestId) {
      this.activeRuns.set(requestId, new Set());
    }

    try {
      const results = await mapWithConcurrency(request.items, 2, async (item) => {
        const snapshot = await this.snapshotProvider.getSnapshot(request.source, item.pullRequest, request.snapshotPolicy);
        const preview = buildPullRequestAnalysisPreview(snapshot, Boolean(request.snapshotPolicy?.strictMode));

        if (preview.lacksPatchCoverage) {
          return {
            pullRequestId: item.pullRequest.id,
            repository: item.pullRequest.repository,
            status: 'omitted' as const,
            topConcerns: [],
            reviewChecklist: [],
            coverageNote: preview.partialReason || preview.sensitivity.summary,
          };
        }

        if (preview.strictModeWouldBlock) {
          const blockedBySensitiveConfig = preview.sensitivity.hasSensitiveConfigFiles && !preview.sensitivity.hasSecretPatterns;
          return {
            pullRequestId: item.pullRequest.id,
            repository: item.pullRequest.repository,
            status: 'omitted' as const,
            topConcerns: [],
            reviewChecklist: [],
            coverageNote: preview.lacksPatchCoverage
              ? 'PR omitido por modo estricto: el snapshot no incluye diff textual suficiente para una revision segura.'
              : blockedBySensitiveConfig
                ? 'PR omitido por modo estricto: se detectaron archivos potencialmente sensibles y la cobertura del diff es incompleta.'
                : 'PR omitido por modo estricto y señales sensibles en el diff.',
          };
        }

        const prompt = this.promptBuilder.build(request, snapshot);
        const timeoutMs = request.timeoutMs ?? 60_000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
        if (requestId) {
          this.activeRuns.get(requestId)?.add(controller);
        }

        try {
          const rawText = await this.analysisClient.analyze({ request, prompt, signal: controller.signal });
          const parsed = this.responseParser.parse(rawText);

          return {
            pullRequestId: item.pullRequest.id,
            repository: item.pullRequest.repository,
            status: 'analyzed' as const,
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
            status: 'error' as const,
            topConcerns: [],
            reviewChecklist: [],
            error: error instanceof Error
              ? error.message
              : 'No fue posible analizar el PR.',
          };
        } finally {
          clearTimeout(timeoutId);
          if (requestId) {
            this.activeRuns.get(requestId)?.delete(controller);
          }
        }
      });

      return results;
    } finally {
      if (requestId) {
        this.activeRuns.delete(requestId);
      }
    }
  }

  cancelAnalysis(requestId: string): void {
    const controllers = this.activeRuns.get(requestId);
    if (!controllers) {
      return;
    }

    controllers.forEach((controller) => controller.abort('cancelled'));
    this.activeRuns.delete(requestId);
  }
}
