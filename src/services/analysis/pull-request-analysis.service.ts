import type { PullRequestAiReview, PullRequestAnalysisBatchRequest } from '../../types/analysis';
import { buildSnapshotSensitivitySummary } from '../shared/snapshot-content';
import { OpenAIPullRequestAnalysisClient } from './pull-request-analysis.openai-client';
import { PullRequestAnalysisPromptBuilder } from './pull-request-analysis.prompt-builder';
import { PullRequestAnalysisResponseParser } from './pull-request-analysis.response-parser';
import { PullRequestAnalysisSnapshotProvider } from './pull-request-analysis.snapshot-provider';

export class PullRequestAnalysisService {
  constructor(
    private readonly snapshotProvider: PullRequestAnalysisSnapshotProvider,
    private readonly promptBuilder: PullRequestAnalysisPromptBuilder = new PullRequestAnalysisPromptBuilder(),
    private readonly analysisClient: OpenAIPullRequestAnalysisClient = new OpenAIPullRequestAnalysisClient(),
    private readonly responseParser: PullRequestAnalysisResponseParser = new PullRequestAnalysisResponseParser(),
  ) {}

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

    const results: PullRequestAiReview[] = [];
    for (const item of request.items) {
      const snapshot = await this.snapshotProvider.getSnapshot(request.source, item.pullRequest, request.snapshotPolicy);
      const sensitivity = buildSnapshotSensitivitySummary(
        snapshot.files
          .filter((file) => file.patch)
          .map((file) => ({
            path: file.path,
            extension: file.path.split('.').pop()?.toLowerCase() || '',
            size: file.patch?.length || 0,
            content: file.patch || '',
          })),
      );

      if (request.snapshotPolicy?.strictMode && (sensitivity.hasSecretPatterns || sensitivity.hasSensitiveConfigFiles)) {
        results.push({
          pullRequestId: item.pullRequest.id,
          repository: item.pullRequest.repository,
          status: 'omitted',
          topConcerns: [],
          reviewChecklist: [],
          coverageNote: 'PR omitido por modo estricto y señales sensibles en el diff.',
        });
        continue;
      }

      try {
        const prompt = this.promptBuilder.build(request, snapshot);
        const rawText = await this.analysisClient.analyze({ request, prompt });
        const parsed = this.responseParser.parse(rawText);
        results.push({
          pullRequestId: item.pullRequest.id,
          repository: item.pullRequest.repository,
          status: 'analyzed',
          riskScore: Math.max(0, Math.min(100, Math.round(parsed.riskScore))),
          shortSummary: parsed.shortSummary,
          topConcerns: parsed.topConcerns,
          reviewChecklist: parsed.reviewChecklist,
          coverageNote: snapshot.partialReason,
        });
      } catch (error) {
        results.push({
          pullRequestId: item.pullRequest.id,
          repository: item.pullRequest.repository,
          status: 'error',
          topConcerns: [],
          reviewChecklist: [],
          error: error instanceof Error ? error.message : 'No fue posible analizar el PR.',
        });
      }
    }

    return results;
  }
}
