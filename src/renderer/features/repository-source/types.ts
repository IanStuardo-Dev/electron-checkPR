import type {
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositoryProviderSelection,
  RepositorySummary,
} from '../../../types/repository';

export type SavedConnectionConfig = Omit<RepositoryConnectionConfig, 'provider' | 'personalAccessToken'> & {
  provider: RepositoryProviderSelection;
  personalAccessToken: string;
};

export interface RepositorySourceDiagnostics {
  operation: 'projects' | 'repositories' | 'pullRequests' | null;
  provider: RepositoryProviderSelection;
  organization: string;
  project: string;
  repositoryId: string;
  requestPath: string;
  lastError: string | null;
}

export interface RepositorySourceScope {
  projects: RepositoryProject[];
  projectsLoading: boolean;
  repositories: RepositorySummary[];
  repositoriesLoading: boolean;
  selectedRepositoryName: string | null;
}
