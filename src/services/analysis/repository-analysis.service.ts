import type { RepositoryAnalysisRequest, RepositoryAnalysisResult } from '../../types/analysis';
import { OpenAIRepositoryAnalysisClient } from './repository-analysis.openai-client';
import { RepositoryAnalysisPromptBuilder } from './repository-analysis.prompt-builder';
import type {
  AnalysisClientPort,
  AnalysisPromptBuilderPort,
  AnalysisResponseParserPort,
  SnapshotProviderPort,
} from './repository-analysis.ports';
import { RepositoryAnalysisResponseParser } from './repository-analysis.response-parser';

interface ActiveAnalysisRun {
  cancelled: boolean;
  controller: AbortController | null;
  timeoutId: NodeJS.Timeout | null;
}

const DEFAULT_ANALYSIS_TIMEOUT_MS = 90_000;

export class RepositoryAnalysisService {
  private activeRuns = new Map<string, ActiveAnalysisRun>();

  constructor(
    private readonly snapshotProvider: SnapshotProviderPort,
    private readonly promptBuilder: AnalysisPromptBuilderPort = new RepositoryAnalysisPromptBuilder(),
    private readonly analysisClient: AnalysisClientPort = new OpenAIRepositoryAnalysisClient(),
    private readonly responseParser: AnalysisResponseParserPort = new RepositoryAnalysisResponseParser(),
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

    const snapshot = await this.snapshotProvider.getSnapshot(request);
    this.assertRunNotCancelled(request.requestId);
    if (snapshot.files.length === 0) {
      this.cleanupRun(request.requestId);
      throw new Error('No se encontraron archivos de codigo legibles para analizar en el scope seleccionado.');
    }

    const prompt = this.promptBuilder.build(request, snapshot);
    const timeoutMs = request.timeoutMs ?? DEFAULT_ANALYSIS_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
    const activeRun = this.activeRuns.get(request.requestId);
    if (activeRun) {
      activeRun.controller = controller;
      activeRun.timeoutId = timeoutId;
    }

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
