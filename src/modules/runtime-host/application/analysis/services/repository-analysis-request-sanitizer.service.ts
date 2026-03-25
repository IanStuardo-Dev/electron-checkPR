import type { RepositoryAnalysisRequest } from '../../../../../types/analysis';
import { clampNumber, normalizeOptionalString, normalizeProvider, readRequiredString, readSnapshotPolicy } from './analysis-input-normalizers.service';

export function sanitizeRepositoryAnalysisPayload(payload: unknown, codexApiKey = ''): RepositoryAnalysisRequest {
  if (!payload || typeof payload !== 'object') {
    throw new Error('El payload de analisis es invalido.');
  }

  const request = payload as Partial<RepositoryAnalysisRequest>;
  const rawPromptDirectives = request.promptDirectives && typeof request.promptDirectives === 'object'
    ? request.promptDirectives as unknown as Record<string, unknown>
    : {};

  if (!request.source || typeof request.source !== 'object') {
    throw new Error('La fuente del analisis es obligatoria.');
  }

  const source = request.source as unknown as Record<string, unknown>;
  const provider = normalizeProvider(source.provider, 'El provider del analisis');
  const project = typeof source.project === 'string' ? source.project.trim() : '';

  if (provider === 'azure-devops' && !project) {
    throw new Error('Azure DevOps requiere un project valido para ejecutar el analisis.');
  }

  return {
    requestId: readRequiredString(request.requestId, 'requestId'),
    source: {
      provider,
      organization: readRequiredString(source.organization, 'organization'),
      project,
      repositoryId: normalizeOptionalString(source.repositoryId),
      personalAccessToken: readRequiredString(source.personalAccessToken, 'personalAccessToken'),
      targetReviewer: normalizeOptionalString(source.targetReviewer),
    },
    repositoryId: readRequiredString(request.repositoryId, 'repositoryId'),
    branchName: readRequiredString(request.branchName, 'branchName'),
    model: readRequiredString(request.model, 'model'),
    apiKey: typeof request.apiKey === 'string' && request.apiKey.trim()
      ? request.apiKey.trim()
      : readRequiredString(codexApiKey, 'apiKey'),
    analysisDepth: request.analysisDepth === 'deep' ? 'deep' : 'standard',
    maxFilesPerRun: clampNumber(request.maxFilesPerRun, 10, 200, 0),
    includeTests: Boolean(request.includeTests),
    snapshotPolicy: readSnapshotPolicy(request.snapshotPolicy),
    timeoutMs: clampNumber(request.timeoutMs, 15_000, 120_000, 90_000),
    promptDirectives: {
      architectureReviewEnabled: Boolean(rawPromptDirectives.architectureReviewEnabled),
      architecturePattern: typeof rawPromptDirectives.architecturePattern === 'string'
        ? rawPromptDirectives.architecturePattern.trim().slice(0, 500)
        : '',
      requiredPractices: typeof rawPromptDirectives.requiredPractices === 'string'
        ? rawPromptDirectives.requiredPractices.trim().slice(0, 2000)
        : '',
      forbiddenPractices: typeof rawPromptDirectives.forbiddenPractices === 'string'
        ? rawPromptDirectives.forbiddenPractices.trim().slice(0, 2000)
        : '',
      domainContext: typeof rawPromptDirectives.domainContext === 'string'
        ? rawPromptDirectives.domainContext.trim().slice(0, 1500)
        : '',
      customInstructions: typeof rawPromptDirectives.customInstructions === 'string'
        ? rawPromptDirectives.customInstructions.trim().slice(0, 2500)
        : '',
    },
  };
}

