import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview } from '../../types/analysis';
import { mapWithConcurrency } from '../../shared/request-control';
import type {
  PullRequestAnalysisClientPort,
  PullRequestAnalysisPromptBuilderPort,
  PullRequestAnalysisResponseParserPort,
  PullRequestAnalysisSnapshotProviderPort,
} from './pull-request-analysis.ports';
import { buildPullRequestAnalysisPreview } from './pull-request-analysis.preview';
import { PullRequestAnalysisItemAnalyzer } from './pull-request-analysis.item-analyzer';

interface PullRequestAnalysisServiceDependencies {
  snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  promptBuilder: PullRequestAnalysisPromptBuilderPort;
  analysisClient: PullRequestAnalysisClientPort;
  responseParser: PullRequestAnalysisResponseParserPort;
}

const DEFAULT_PREVIEW_CONCURRENCY = 3;
const DEFAULT_ANALYSIS_CONCURRENCY = 2;

function resolveConcurrencyLimit(rawLimit: unknown, fallback: number, itemCount: number): number {
  const parsedLimit = typeof rawLimit === 'number'
    ? rawLimit
    : Number.parseInt(String(rawLimit ?? ''), 10);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return Math.max(1, Math.min(fallback, itemCount));
  }

  return Math.max(1, Math.min(Math.floor(parsedLimit), itemCount));
}

export class PullRequestAnalysisService {
  private activeRuns = new Map<string, Set<AbortController>>();
  private readonly snapshotProvider: PullRequestAnalysisSnapshotProviderPort;
  private readonly itemAnalyzer: PullRequestAnalysisItemAnalyzer;

  constructor({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  }: PullRequestAnalysisServiceDependencies) {
    this.snapshotProvider = snapshotProvider;
    this.itemAnalyzer = new PullRequestAnalysisItemAnalyzer({
      snapshotProvider,
      promptBuilder,
      analysisClient,
      responseParser,
    });
  }

  async previewBatch(request: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]> {
    const previewConcurrency = resolveConcurrencyLimit(
      request.previewConcurrency,
      DEFAULT_PREVIEW_CONCURRENCY,
      request.items.length,
    );

    return mapWithConcurrency(request.items, previewConcurrency, async (item) => {
      const snapshot = await this.snapshotProvider.getSnapshot(
        request.source,
        item.pullRequest,
        request.snapshotPolicy,
      );
      return buildPullRequestAnalysisPreview(snapshot, Boolean(request.snapshotPolicy?.strictMode));
    });
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
      const analysisConcurrency = resolveConcurrencyLimit(
        request.analysisConcurrency,
        DEFAULT_ANALYSIS_CONCURRENCY,
        request.items.length,
      );
      const results = await mapWithConcurrency(request.items, analysisConcurrency, async (item) => this.itemAnalyzer.analyzeItem(
        request,
        item,
        {
          onControllerCreated: (controller) => {
            if (requestId) {
              this.activeRuns.get(requestId)?.add(controller);
            }
          },
          onControllerDisposed: (controller) => {
            if (requestId) {
              this.activeRuns.get(requestId)?.delete(controller);
            }
          },
        },
      ));

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
