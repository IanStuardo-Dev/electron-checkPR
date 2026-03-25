import type { PullRequestAnalysisBatchRequest, PullRequestAnalysisPromptDirectives } from '../../../../../types/analysis';
import { clampNumber, normalizeOptionalString, normalizeProvider, readRequiredString, readSnapshotPolicy } from './analysis-input-normalizers.service';

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

  const source = request.source as unknown as Record<string, unknown>;

  return {
    requestId: typeof request.requestId === 'string' ? request.requestId.trim().slice(0, 200) : '',
    source: {
      provider: normalizeProvider(source.provider, 'El provider del PR analysis'),
      organization: readRequiredString(source.organization, 'organization'),
      project: typeof source.project === 'string' ? source.project.trim() : '',
      repositoryId: normalizeOptionalString(source.repositoryId),
      personalAccessToken: readRequiredString(source.personalAccessToken, 'personalAccessToken'),
      targetReviewer: normalizeOptionalString(source.targetReviewer),
    },
    apiKey: typeof request.apiKey === 'string' && request.apiKey.trim()
      ? request.apiKey.trim()
      : readRequiredString(codexApiKey, 'apiKey'),
    model: readRequiredString(request.model, 'model'),
    analysisDepth: request.analysisDepth === 'deep' ? 'deep' : 'standard',
    timeoutMs: clampNumber(request.timeoutMs, 15_000, 120_000, 60_000),
    snapshotPolicy: readSnapshotPolicy(request.snapshotPolicy),
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

