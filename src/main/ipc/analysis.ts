import type { PullRequestAnalysisBatchRequest, PullRequestAnalysisPreview, PullRequestAnalysisPromptDirectives, RepositoryAnalysisRequest, RepositorySnapshotPreview } from '../../types/analysis';
import type { RepositoryProviderKind } from '../../types/repository';
import { RepositoryAnalysisService } from '../../services/analysis/repository-analysis.service';
import { PullRequestAnalysisService } from '../../services/analysis/pull-request-analysis.service';
import type { SessionSecretsStore } from './session-secrets';
import { CODEX_SESSION_API_KEY } from '../../constants/session-secrets';
import { registerHandle } from './shared';

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return value.trim();
}

export function sanitizeAnalysisPayload(payload: unknown, codexApiKey = ''): RepositoryAnalysisRequest {
  if (!payload || typeof payload !== 'object') {
    throw new Error('El payload de analisis es invalido.');
  }

  const request = payload as Partial<RepositoryAnalysisRequest>;
  const maxFilesPerRun = Math.min(200, Math.max(10, Math.floor(Number(request.maxFilesPerRun) || 0)));
  const timeoutMs = Math.min(120_000, Math.max(15_000, Math.floor(Number(request.timeoutMs) || 90_000)));
  const analysisDepth = request.analysisDepth === 'deep' ? 'deep' : 'standard';
  const rawPromptDirectives = request.promptDirectives && typeof request.promptDirectives === 'object'
    ? request.promptDirectives
    : {};

  if (!request.source || typeof request.source !== 'object') {
    throw new Error('La fuente del analisis es obligatoria.');
  }

  const source = request.source as RepositoryAnalysisRequest['source'];
  if (!['azure-devops', 'github', 'gitlab'].includes(source.provider)) {
    throw new Error('El provider del analisis no es valido.');
  }

  if (source.provider === 'azure-devops' && !(typeof source.project === 'string' && source.project.trim())) {
    throw new Error('Azure DevOps requiere un project valido para ejecutar el analisis.');
  }

  return {
    requestId: readString(request.requestId, 'requestId'),
    source: {
      ...source,
      provider: source.provider as RepositoryProviderKind,
      organization: readString(source.organization, 'organization'),
      project: typeof source.project === 'string' ? source.project.trim() : '',
      repositoryId: typeof source.repositoryId === 'string' ? source.repositoryId.trim() : undefined,
      personalAccessToken: readString(source.personalAccessToken, 'personalAccessToken'),
      targetReviewer: typeof source.targetReviewer === 'string' ? source.targetReviewer.trim() : undefined,
    },
    repositoryId: readString(request.repositoryId, 'repositoryId'),
    branchName: readString(request.branchName, 'branchName'),
    model: readString(request.model, 'model'),
    apiKey: typeof request.apiKey === 'string' && request.apiKey.trim()
      ? request.apiKey.trim()
      : readString(codexApiKey, 'apiKey'),
    analysisDepth,
    maxFilesPerRun,
    includeTests: Boolean(request.includeTests),
    snapshotPolicy: {
      excludedPathPatterns: typeof (request as Partial<RepositoryAnalysisRequest>).snapshotPolicy?.excludedPathPatterns === 'string'
        ? (request as Partial<RepositoryAnalysisRequest>).snapshotPolicy!.excludedPathPatterns.slice(0, 4000)
        : '',
      strictMode: Boolean((request as Partial<RepositoryAnalysisRequest>).snapshotPolicy?.strictMode),
    },
    timeoutMs,
    promptDirectives: {
      architectureReviewEnabled: Boolean((rawPromptDirectives as Record<string, unknown>).architectureReviewEnabled),
      architecturePattern: typeof (rawPromptDirectives as Record<string, unknown>).architecturePattern === 'string'
        ? (rawPromptDirectives as Record<string, string>).architecturePattern.trim().slice(0, 500)
        : '',
      requiredPractices: typeof (rawPromptDirectives as Record<string, unknown>).requiredPractices === 'string'
        ? (rawPromptDirectives as Record<string, string>).requiredPractices.trim().slice(0, 2000)
        : '',
      forbiddenPractices: typeof (rawPromptDirectives as Record<string, unknown>).forbiddenPractices === 'string'
        ? (rawPromptDirectives as Record<string, string>).forbiddenPractices.trim().slice(0, 2000)
        : '',
      domainContext: typeof (rawPromptDirectives as Record<string, unknown>).domainContext === 'string'
        ? (rawPromptDirectives as Record<string, string>).domainContext.trim().slice(0, 1500)
        : '',
      customInstructions: typeof (rawPromptDirectives as Record<string, unknown>).customInstructions === 'string'
        ? (rawPromptDirectives as Record<string, string>).customInstructions.trim().slice(0, 2500)
        : '',
    },
  };
}

export function sanitizePullRequestAnalysisPayload(payload: unknown, codexApiKey = ''): PullRequestAnalysisBatchRequest {
  if (!payload || typeof payload !== 'object') {
    throw new Error('El payload de PR analysis es invalido.');
  }

  const request = payload as Partial<PullRequestAnalysisBatchRequest>;
  const rawPromptDirectives = request.promptDirectives && typeof request.promptDirectives === 'object'
    ? request.promptDirectives as PullRequestAnalysisPromptDirectives
    : { focusAreas: '', customInstructions: '' };

  if (!request.source || typeof request.source !== 'object') {
    throw new Error('La fuente del PR analysis es obligatoria.');
  }

  const source = request.source as PullRequestAnalysisBatchRequest['source'];
  if (!['azure-devops', 'github', 'gitlab'].includes(source.provider)) {
    throw new Error('El provider del PR analysis no es valido.');
  }

  return {
    requestId: typeof request.requestId === 'string' ? request.requestId.trim().slice(0, 200) : '',
    source: {
      ...source,
      provider: source.provider as RepositoryProviderKind,
      organization: readString(source.organization, 'organization'),
      project: typeof source.project === 'string' ? source.project.trim() : '',
      repositoryId: typeof source.repositoryId === 'string' ? source.repositoryId.trim() : undefined,
      personalAccessToken: readString(source.personalAccessToken, 'personalAccessToken'),
      targetReviewer: typeof source.targetReviewer === 'string' ? source.targetReviewer.trim() : undefined,
    },
    apiKey: typeof request.apiKey === 'string' && request.apiKey.trim()
      ? request.apiKey.trim()
      : readString(codexApiKey, 'apiKey'),
    model: readString(request.model, 'model'),
    analysisDepth: request.analysisDepth === 'deep' ? 'deep' : 'standard',
    timeoutMs: Math.min(120_000, Math.max(15_000, Math.floor(Number(request.timeoutMs) || 60_000))),
    snapshotPolicy: {
      excludedPathPatterns: typeof request.snapshotPolicy?.excludedPathPatterns === 'string'
        ? request.snapshotPolicy.excludedPathPatterns.slice(0, 4000)
        : '',
      strictMode: Boolean(request.snapshotPolicy?.strictMode),
    },
    promptDirectives: {
      focusAreas: typeof rawPromptDirectives.focusAreas === 'string' ? rawPromptDirectives.focusAreas.trim().slice(0, 2000) : '',
      customInstructions: typeof rawPromptDirectives.customInstructions === 'string' ? rawPromptDirectives.customInstructions.trim().slice(0, 2500) : '',
    },
    items: Array.isArray(request.items)
      ? request.items
        .filter((item) => item && typeof item === 'object' && typeof item.pullRequest === 'object')
        .map((item) => ({ pullRequest: item.pullRequest! }))
      : [],
  };
}

export function registerAnalysisIpc(
  repositoryAnalysisService: RepositoryAnalysisService,
  pullRequestAnalysisService: PullRequestAnalysisService,
  sessionSecretsStore: SessionSecretsStore,
): void {
  const readCodexApiKey = () => sessionSecretsStore.get(CODEX_SESSION_API_KEY);
  registerHandle<unknown, RepositorySnapshotPreview>('analysis:previewRepositorySnapshot', async (payload) => (
    repositoryAnalysisService.previewSnapshot(sanitizeAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<unknown, unknown>('analysis:runRepositoryAnalysis', async (payload) => (
    repositoryAnalysisService.runAnalysis(sanitizeAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<string, void>('analysis:cancelRepositoryAnalysis', async (requestId) => {
    repositoryAnalysisService.cancelAnalysis(requestId);
  });
  registerHandle<unknown, PullRequestAnalysisPreview[]>('analysis:previewPullRequestAiReviews', async (payload) => (
    pullRequestAnalysisService.previewBatch(sanitizePullRequestAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<unknown, unknown>('analysis:runPullRequestAiReviews', async (payload) => (
    pullRequestAnalysisService.analyzeBatch(sanitizePullRequestAnalysisPayload(payload, readCodexApiKey()))
  ));
  registerHandle<string, void>('analysis:cancelPullRequestAiReviews', async (requestId) => {
    pullRequestAnalysisService.cancelAnalysis(requestId);
  });
}
