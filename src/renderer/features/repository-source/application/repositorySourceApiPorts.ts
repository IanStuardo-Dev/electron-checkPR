import type { RepositoryProject, RepositorySummary, ReviewItem } from '../../../../types/repository';
import type { SavedConnectionConfig } from '../types';

export interface RepositorySourceStatePort {
  setPullRequests: (items: ReviewItem[]) => void;
  setProjects: (items: RepositoryProject[]) => void;
  setRepositories: (items: RepositorySummary[]) => void;
  setError: (message: string | null) => void;
  setProjectDiscoveryWarning: (message: string | null) => void;
  setIsLoading: (value: boolean) => void;
  setProjectsLoading: (value: boolean) => void;
  setRepositoriesLoading: (value: boolean) => void;
  setLastUpdatedAt: (value: Date | null) => void;
  setHasSuccessfulConnection: (value: boolean) => void;
  setIsConnectionPanelOpen: (value: boolean) => void;
}

export interface RepositorySourceDiagnosticsPort {
  updateDiagnostics: (
    operation: 'projects' | 'repositories' | 'pullRequests' | null,
    config: SavedConnectionConfig,
    error: string | null,
  ) => void;
}

export interface RepositorySourceSnapshotPort {
  persistSnapshot: (
    pullRequests: ReviewItem[],
    capturedAt: Date,
    scopeLabel: string,
    targetReviewer?: string,
  ) => void;
}

