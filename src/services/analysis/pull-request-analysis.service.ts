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
      const results = await mapWithConcurrency(request.items, 2, async (item) => this.itemAnalyzer.analyzeItem(
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
