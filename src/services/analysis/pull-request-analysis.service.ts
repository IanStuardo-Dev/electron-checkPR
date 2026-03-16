import type { PullRequestAiReview, PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview, PullRequestSnapshot } from '../../types/analysis';
import { buildSnapshotSensitivitySummary } from '../shared/snapshot-content';
import { mapWithConcurrency } from '../shared/request-control';
import { OpenAIPullRequestAnalysisClient } from './pull-request-analysis.openai-client';
import { PullRequestAnalysisPromptBuilder } from './pull-request-analysis.prompt-builder';
import { PullRequestAnalysisResponseParser } from './pull-request-analysis.response-parser';
import type { PullRequestAnalysisSnapshotProvider } from './pull-request-analysis.snapshot-provider';

export class PullRequestAnalysisService {
  private activeRuns = new Map<string, Set<AbortController>>();

  constructor(
    private readonly snapshotProvider: PullRequestAnalysisSnapshotProvider,
    private readonly promptBuilder: PullRequestAnalysisPromptBuilder = new PullRequestAnalysisPromptBuilder(),
    private readonly analysisClient: OpenAIPullRequestAnalysisClient = new OpenAIPullRequestAnalysisClient(),
    private readonly responseParser: PullRequestAnalysisResponseParser = new PullRequestAnalysisResponseParser(),
  ) {}

  private buildPreview(snapshot: PullRequestSnapshot, strictMode: boolean): PullRequestAnalysisPreview {
    const textFiles = snapshot.files
      .filter((file) => file.patch)
      .map((file) => ({
        path: file.path,
        extension: file.path.split('.').pop()?.toLowerCase() || '',
        size: file.patch?.length || 0,
        content: file.patch || '',
      }));
    const metadataSensitivity = buildSnapshotSensitivitySummary(
      snapshot.files.map((file) => ({
        path: file.path,
        extension: file.path.split('.').pop()?.toLowerCase() || '',
        size: file.patch?.length || 0,
        content: '',
      })),
    );
    const sensitivity = buildSnapshotSensitivitySummary(textFiles);
    const lacksPatchCoverage = textFiles.length === 0;
    const hasIncompletePatchCoverage = snapshot.files.length > textFiles.length;

    return {
      pullRequestId: snapshot.pullRequestId,
      repository: snapshot.repository,
      title: snapshot.title,
      filesPrepared: snapshot.files.length,
      totalFilesChanged: snapshot.totalFilesChanged,
      includedFiles: snapshot.files.slice(0, 8).map((file) => file.path),
      truncated: snapshot.truncated,
      partialReason: snapshot.partialReason,
      sensitivity: {
        findings: [
          ...metadataSensitivity.findings,
          ...sensitivity.findings.filter((finding) => !metadataSensitivity.findings.some((metadataFinding) => (
            metadataFinding.kind === finding.kind && metadataFinding.path === finding.path
          ))),
        ].slice(0, 10),
        hasSensitiveConfigFiles: metadataSensitivity.hasSensitiveConfigFiles || sensitivity.hasSensitiveConfigFiles,
        hasSecretPatterns: sensitivity.hasSecretPatterns,
        noSensitiveConfigFilesDetected: metadataSensitivity.noSensitiveConfigFilesDetected && sensitivity.noSensitiveConfigFilesDetected,
        summary: lacksPatchCoverage
          ? 'El provider no entrego diff textual suficiente para este PR. No se enviara automaticamente a Codex.'
          : sensitivity.summary,
      },
      disclaimer: strictMode
        ? 'Revisa este snapshot antes de enviar a Codex. En modo estricto se bloqueara el envio si hay sensibilidad o cobertura incompleta.'
        : 'Revisa este snapshot local antes de decidir si quieres enviarlo a Codex para analisis IA.',
      lacksPatchCoverage,
      strictModeWouldBlock: strictMode && (
        lacksPatchCoverage
        || hasIncompletePatchCoverage
        || sensitivity.hasSecretPatterns
        || sensitivity.hasSensitiveConfigFiles
        || metadataSensitivity.hasSensitiveConfigFiles
      ),
    };
  }

  async previewBatch(request: PullRequestAnalysisBatchRequest): Promise<PullRequestAnalysisPreview[]> {
    const previews: PullRequestAnalysisPreview[] = [];

    for (const item of request.items) {
      const snapshot = await this.snapshotProvider.getSnapshot(request.source, item.pullRequest, request.snapshotPolicy);
      previews.push(this.buildPreview(snapshot, Boolean(request.snapshotPolicy?.strictMode)));
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
        const preview = this.buildPreview(snapshot, Boolean(request.snapshotPolicy?.strictMode));

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
