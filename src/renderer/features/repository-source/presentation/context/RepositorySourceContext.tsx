import React from 'react';
import type { RepositoryProject, RepositoryProviderDefinition, RepositorySummary, ReviewItem } from '../../../../../types/repository';
import type { DashboardSummary } from '../../../../shared/dashboard/summary.types';
import type { RepositorySourceDiagnostics, SavedConnectionConfig } from '../../types';
import { useRepositorySource } from '../hooks/useRepositorySource';

export interface RepositorySourceContextValue {
  activeProvider: RepositoryProviderDefinition | null;
  activeProviderName: string;
  config: SavedConnectionConfig;
  error: string | null;
  isLoading: boolean;
  projects: RepositoryProject[];
  projectsLoading: boolean;
  projectDiscoveryWarning: string | null;
  repositories: RepositorySummary[];
  repositoriesLoading: boolean;
  hasCredentialsInSession: boolean;
  hasSuccessfulConnection: boolean;
  isConnectionReady: boolean;
  diagnostics: RepositorySourceDiagnostics;
  selectedProjectName: string | null;
  selectedRepositoryName: string | null;
  summary: DashboardSummary;
  isConnectionPanelOpen: boolean;
  updateConfig(name: keyof SavedConnectionConfig, value: string): void;
  discoverProjects(): Promise<unknown[] | void>;
  selectProject(project: string): void;
  refreshPullRequests(): Promise<ReviewItem[] | void>;
  openPullRequest(url: string): Promise<void>;
  openConnectionPanel(): void;
}

const RepositorySourceContext = React.createContext<RepositorySourceContextValue | null>(null);

export function RepositorySourceProvider({ children }: { children: React.ReactNode }) {
  const value: RepositorySourceContextValue = useRepositorySource();

  return (
    <RepositorySourceContext.Provider value={value}>
      {children}
    </RepositorySourceContext.Provider>
  );
}

export function useRepositorySourceContext(): RepositorySourceContextValue {
  const value = React.useContext(RepositorySourceContext);

  if (!value) {
    throw new Error('useRepositorySourceContext debe usarse dentro de RepositorySourceProvider.');
  }

  return value;
}
