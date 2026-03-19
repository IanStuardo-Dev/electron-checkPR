import type { RepositoryProject, RepositorySummary } from '../../../../../types/repository';
import type { SavedConnectionConfig } from '../../../repository-source/contracts';

export interface SettingsProviderConnectionProps {
  activeProviderName: string;
  config: SavedConnectionConfig;
  error: string | null;
  isConnectionReady: boolean;
  isLoading: boolean;
  projects: RepositoryProject[];
  projectsLoading: boolean;
  projectDiscoveryWarning: string | null;
  repositories: RepositorySummary[];
  repositoriesLoading: boolean;
  discoverProjects: () => void;
  selectProject: (project: string) => void;
  updateConfig: (name: keyof SavedConnectionConfig, value: string) => void;
  refreshPullRequests: () => void;
}
