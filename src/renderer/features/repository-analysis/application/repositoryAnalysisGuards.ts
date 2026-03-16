import type { RepositoryProviderDefinition } from '../../../../types/repository';
import type { RepositorySnapshotPreview } from '../../../../types/analysis';
import type { CodexIntegrationConfig } from '../../settings';

export function canPrepareRepositoryAnalysisPreview({
  providerKind,
  activeProvider,
  isConnectionReady,
  isCodexReady,
  repositoryId,
  branchName,
  isRunning,
  isPreviewing,
}: {
  providerKind: string;
  activeProvider: RepositoryProviderDefinition | null;
  isConnectionReady: boolean;
  isCodexReady: boolean;
  repositoryId: string;
  branchName: string;
  isRunning: boolean;
  isPreviewing: boolean;
}): boolean {
  return Boolean(
    providerKind
    && activeProvider
    && isConnectionReady
    && isCodexReady
    && repositoryId
    && branchName
    && !isRunning
    && !isPreviewing,
  );
}

export function isRepositoryAnalysisStrictModeBlocked(
  preview: RepositorySnapshotPreview | null,
  codexConfig: CodexIntegrationConfig,
): boolean {
  return Boolean(
    preview
    && codexConfig.snapshotPolicy.strictMode
    && (preview.sensitivity.hasSecretPatterns || preview.sensitivity.hasSensitiveConfigFiles),
  );
}

export function canRunRepositoryAnalysis({
  providerKind,
  activeProvider,
  isConnectionReady,
  isCodexReady,
  repositoryId,
  branchName,
  preview,
  snapshotAcknowledged,
  isStrictModeBlocked,
  isRunning,
}: {
  providerKind: string;
  activeProvider: RepositoryProviderDefinition | null;
  isConnectionReady: boolean;
  isCodexReady: boolean;
  repositoryId: string;
  branchName: string;
  preview: RepositorySnapshotPreview | null;
  snapshotAcknowledged: boolean;
  isStrictModeBlocked: boolean;
  isRunning: boolean;
}): boolean {
  return Boolean(
    providerKind
    && activeProvider
    && isConnectionReady
    && isCodexReady
    && repositoryId
    && branchName
    && preview
    && preview.provider === activeProvider.kind
    && preview.branch === branchName
    && snapshotAcknowledged
    && !isStrictModeBlocked
    && !isRunning,
  );
}
