import React from 'react';
import type { RepositoryProviderKind, RepositoryProviderDefinition, RepositoryProject, RepositorySummary } from '../../../../../types/repository';
import { repositoryProviders } from '../../providers';
import type { SavedConnectionConfig } from '../../types';
import ConnectionPanel from './ConnectionPanel';
import RepositorySourceProviderCard from './RepositorySourceProviderCard';

interface RepositorySourceProviderCatalogProps {
  activeProvider: RepositoryProviderDefinition | null;
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

export function RepositorySourceProviderCatalog({
  activeProvider,
  activeProviderName,
  config,
  error,
  isConnectionReady,
  isLoading,
  projects,
  projectsLoading,
  projectDiscoveryWarning,
  repositories,
  repositoriesLoading,
  discoverProjects,
  selectProject,
  updateConfig,
  refreshPullRequests,
}: RepositorySourceProviderCatalogProps) {
  const [expandedProviderKind, setExpandedProviderKind] = React.useState<RepositoryProviderKind | ''>(config.provider);

  React.useEffect(() => {
    setExpandedProviderKind(config.provider);
  }, [config.provider]);

  return (
    <>
      {repositoryProviders.map((provider) => (
        <RepositorySourceProviderCard
          key={provider.kind}
          provider={provider}
          isActive={provider.kind === activeProvider?.kind}
          isConfigured={provider.kind === activeProvider?.kind && isConnectionReady}
          expanded={provider.kind === activeProvider?.kind && expandedProviderKind === provider.kind}
          onToggleExpand={provider.status === 'available' && provider.kind === activeProvider?.kind
            ? () => setExpandedProviderKind((current: RepositoryProviderKind | '') => (current === provider.kind ? '' : provider.kind))
            : undefined}
          onActivate={provider.status === 'available' && provider.kind !== activeProvider?.kind
            ? () => {
              updateConfig('provider', provider.kind);
              setExpandedProviderKind(provider.kind);
            }
            : undefined}
        >
          {provider.kind === activeProvider?.kind ? (
            <ConnectionPanel
              providerName={activeProviderName}
              providerKind={provider.kind}
              isConnected={isConnectionReady}
              config={config}
              error={error}
              projectDiscoveryWarning={projectDiscoveryWarning}
              isLoading={isLoading}
              projects={projects}
              projectsLoading={projectsLoading}
              repositories={repositories}
              repositoriesLoading={repositoriesLoading}
              onDiscoverProjects={discoverProjects}
              onSelectProject={selectProject}
              onConfigChange={updateConfig}
              onRefresh={refreshPullRequests}
            />
          ) : null}
        </RepositorySourceProviderCard>
      ))}
    </>
  );
}
