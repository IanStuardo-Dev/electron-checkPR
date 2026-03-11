import type { RepositoryAnalysisRequest } from '../../types/analysis';
import type { RepositoryProviderKind } from '../../types/repository';
import { repositoryAnalysisService } from '../../services/analysis/repository-analysis.service';
import { registerHandle } from './shared';

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return value.trim();
}

export function sanitizeAnalysisPayload(payload: unknown): RepositoryAnalysisRequest {
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
    apiKey: readString(request.apiKey, 'apiKey'),
    analysisDepth,
    maxFilesPerRun,
    includeTests: Boolean(request.includeTests),
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

export function registerAnalysisIpc(): void {
  registerHandle<unknown, unknown>('analysis:runRepositoryAnalysis', async (payload) => (
    repositoryAnalysisService.runAnalysis(sanitizeAnalysisPayload(payload))
  ));
  registerHandle<string, void>('analysis:cancelRepositoryAnalysis', async (requestId) => {
    repositoryAnalysisService.cancelAnalysis(requestId);
  });
}
