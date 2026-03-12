import React from 'react';
import type { RepositoryProviderKind, RepositoryProviderDefinition, RepositoryProject, RepositorySummary } from '../../../../types/repository';
import type { CodexIntegrationConfig, DashboardSummary, SavedConnectionConfig } from '../../dashboard/types';
import ConnectionPanel from '../../dashboard/components/ConnectionPanel';
import ConnectionSummary from '../../dashboard/components/ConnectionSummary';
import { repositoryProviders } from '../../repository-source/providers';
import CodexIntegrationCard from './CodexIntegrationCard';
import RepositoryProviderCard from './RepositoryProviderCard';
import { SettingsSectionCard, SettingsStatusBadge } from './SettingsPrimitives';

export function SettingsIntegrationsSection({
  activeProvider,
  activeProviderName,
  config,
  summary,
  selectedProjectName,
  selectedRepositoryName,
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
  codexConfig,
  isCodexReady,
  updateCodexConfig,
}: {
  activeProvider: RepositoryProviderDefinition | null;
  activeProviderName: string;
  config: SavedConnectionConfig;
  summary: DashboardSummary;
  selectedProjectName: string | null;
  selectedRepositoryName: string | null;
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
  codexConfig: CodexIntegrationConfig;
  isCodexReady: boolean;
  updateCodexConfig: <K extends keyof CodexIntegrationConfig>(name: K, value: CodexIntegrationConfig[K]) => void;
}) {
  const [expandedProviderKind, setExpandedProviderKind] = React.useState<RepositoryProviderKind | ''>(config.provider);

  React.useEffect(() => {
    setExpandedProviderKind(config.provider);
  }, [config.provider]);

  return (
    <section className="space-y-6">
        <ConnectionSummary
          providerKind={activeProvider?.kind}
          providerName={activeProviderName}
          scopeLabel={summary.scopeLabel}
          projectName={selectedProjectName}
          repositoryName={selectedRepositoryName}
          isConnected={isConnectionReady}
          compact
          expandable
          expanded={Boolean(activeProvider && expandedProviderKind === activeProvider.kind)}
          onToggleExpand={activeProvider ? () => setExpandedProviderKind((current) => (current === activeProvider.kind ? '' : activeProvider.kind)) : undefined}
          empty={!config.provider}
        />

        <SettingsSectionCard
          eyebrow="Prioridad 2"
          title="Provider activo y fuentes disponibles"
          description="Primero configura la fuente principal del workspace. Despues puedes cambiar de provider sin salir de Settings."
          badge={<SettingsStatusBadge tone="sky" label={`${repositoryProviders.length} fuentes modeladas`} />}
        >
          <div className="grid gap-4">
            {repositoryProviders.map((provider) => (
              <RepositoryProviderCard
                key={provider.kind}
                provider={provider}
                isActive={provider.kind === activeProvider?.kind}
                isConfigured={provider.kind === activeProvider?.kind && isConnectionReady}
                expanded={provider.kind === activeProvider?.kind && expandedProviderKind === provider.kind}
                onToggleExpand={provider.status === 'available' && provider.kind === activeProvider?.kind
                  ? () => setExpandedProviderKind((current) => (current === provider.kind ? '' : provider.kind))
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
                    onDiscoverProjects={() => void discoverProjects()}
                    onSelectProject={(project) => void selectProject(project)}
                    onConfigChange={updateConfig}
                    onRefresh={() => void refreshPullRequests()}
                  />
                ) : null}
              </RepositoryProviderCard>
            ))}
          </div>
        </SettingsSectionCard>

        <CodexIntegrationCard
          config={codexConfig}
          isReady={isCodexReady}
          onChange={updateCodexConfig}
        />
    </section>
  );
}
