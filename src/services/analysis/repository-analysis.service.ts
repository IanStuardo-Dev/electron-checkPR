import type { RepositoryAnalysisRequest, RepositoryAnalysisResult, RepositorySnapshotPreview } from '../../types/analysis';
import type {
  AnalysisClientPort,
  AnalysisPromptBuilderPort,
  AnalysisResponseParserPort,
  SnapshotProviderPort,
} from './repository-analysis.ports';
import { buildRepositoryAnalysisPreview } from './repository-analysis.preview';
import { RepositoryAnalysisRunStateManager } from './repository-analysis.run-state';

interface RepositoryAnalysisServiceDependencies {
  snapshotProvider: SnapshotProviderPort;
  promptBuilder: AnalysisPromptBuilderPort;
  analysisClient: AnalysisClientPort;
  responseParser: AnalysisResponseParserPort;
}

const DEFAULT_ANALYSIS_TIMEOUT_MS = 90_000;

export class RepositoryAnalysisService {
  private readonly snapshotProvider: SnapshotProviderPort;
  private readonly promptBuilder: AnalysisPromptBuilderPort;
  private readonly analysisClient: AnalysisClientPort;
  private readonly responseParser: AnalysisResponseParserPort;
  private readonly runStateManager = new RepositoryAnalysisRunStateManager();
  readonly activeRuns = this.runStateManager.activeRuns;

  constructor({
    snapshotProvider,
    promptBuilder,
    analysisClient,
    responseParser,
  }: RepositoryAnalysisServiceDependencies) {
    this.snapshotProvider = snapshotProvider;
    this.promptBuilder = promptBuilder;
    this.analysisClient = analysisClient;
    this.responseParser = responseParser;
  }

  async previewSnapshot(request: RepositoryAnalysisRequest): Promise<RepositorySnapshotPreview> {
    const snapshot = await this.snapshotProvider.getSnapshot(request);

    if (snapshot.files.length === 0) {
      throw new Error('No se encontraron archivos de codigo legibles para analizar en el scope seleccionado.');
    }

    return buildRepositoryAnalysisPreview(snapshot);
  }

  async runAnalysis(request: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResult> {
    if (!request.apiKey.trim()) {
      throw new Error('La API key de Codex es obligatoria para ejecutar el analisis.');
    }

    this.runStateManager.registerRun(request.requestId);

    try {
      const snapshot = await this.snapshotProvider.getSnapshot(request);
      this.runStateManager.assertNotCancelled(request.requestId);
      if (snapshot.files.length === 0) {
        throw new Error('No se encontraron archivos de codigo legibles para analizar en el scope seleccionado.');
      }

      const prompt = this.promptBuilder.build(request, snapshot);
      const timeoutMs = request.timeoutMs ?? DEFAULT_ANALYSIS_TIMEOUT_MS;
      const controller = this.runStateManager.createRemoteController(request.requestId, timeoutMs);

      try {
        const rawText = await this.analysisClient.analyze({
          request,
          prompt,
          signal: controller.signal,
        });
        const analysis = this.responseParser.parse(rawText);

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
      }
    } finally {
      this.runStateManager.cleanupRun(request.requestId);
    }
  }

  cancelAnalysis(requestId: string): void {
    this.runStateManager.cancelRun(requestId);
  }
}
