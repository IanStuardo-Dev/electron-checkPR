import type { RepositorySnapshotPreview } from '../../../../types/analysis';
import type { RepositoryBranch, RepositorySummary } from '../../../../types/repository';

export interface RepositoryAnalysisScopeFormProps {
  repositories: RepositorySummary[];
  repositoryId: string;
  branchName: string;
  branches: RepositoryBranch[];
  isConnectionReady: boolean;
  isLoadingBranches: boolean;
  isRunning: boolean;
  branchError: string | null;
  selectedRepositoryName: string;
  providerLabel: string;
  model: string;
  maxFiles: number;
  activeDirectives: number;
  canPreparePreview: boolean;
  canRunAnalysis: boolean;
  preview: RepositorySnapshotPreview | null;
  strictModeEnabled: boolean;
  strictModeBlocked: boolean;
  pendingExcludedPaths: string[];
  snapshotAcknowledged: boolean;
  onToggleExcludedPath: (path: string, checked: boolean) => void;
  onRegenerateWithExclusions: () => void;
  onToggleAcknowledgement: (value: boolean) => void;
  isPreviewing: boolean;
  isCancelling: boolean;
  resultVisible: boolean;
  onRepositoryChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onPreparePreview: () => void;
  onRun: () => void;
  onCancel: () => void;
  onReset: () => void;
}
