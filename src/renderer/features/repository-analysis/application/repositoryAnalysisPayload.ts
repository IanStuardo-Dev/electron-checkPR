import type { RepositoryAnalysisRequest } from '../../../../types/analysis';
import type { RepositoryProviderDefinition } from '../../../../types/repository';
import { mergeExcludedPathPatterns } from '../../../../shared/snapshot-policy';
import type { SavedConnectionConfig } from '../../repository-source/contracts';
import type { CodexIntegrationConfig } from '../../settings';

export function buildRepositoryAnalysisPayload({
  activeProvider,
  config,
  repositoryId,
  branchName,
  codexConfig,
  pendingExcludedPaths,
}: {
  activeProvider: RepositoryProviderDefinition;
  config: SavedConnectionConfig;
  repositoryId: string;
  branchName: string;
  codexConfig: CodexIntegrationConfig;
  pendingExcludedPaths: string[];
}): RepositoryAnalysisRequest {
  return {
    requestId: `${Date.now()}-${repositoryId}-${branchName}`,
    source: {
      ...config,
      provider: activeProvider.kind,
      repositoryId,
      project: activeProvider.kind === 'azure-devops' ? config.project : repositoryId,
    },
    repositoryId,
    branchName,
    model: codexConfig.model,
    apiKey: '',
    analysisDepth: codexConfig.analysisDepth,
    maxFilesPerRun: codexConfig.maxFilesPerRun,
    includeTests: codexConfig.includeTests,
    snapshotPolicy: {
      ...codexConfig.snapshotPolicy,
      excludedPathPatterns: mergeExcludedPathPatterns(
        codexConfig.snapshotPolicy.excludedPathPatterns,
        pendingExcludedPaths.join('\n'),
      ),
    },
    timeoutMs: 90_000,
    promptDirectives: codexConfig.promptDirectives,
  };
}
