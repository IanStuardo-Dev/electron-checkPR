import React from 'react';
import type { RepositoryProviderKind, RepositoryProviderDefinition } from '../../../../../types/repository';
import { ConnectionPanel, repositoryProviders } from '../../../repository-source';
import RepositoryProviderCard from './RepositoryProviderCard';
import { SettingsModal } from '../../../../shared/ui/settings/SettingsPrimitives';
import type { SettingsProviderConnectionProps } from './SettingsProvider.types';

interface SettingsProviderModalProps extends SettingsProviderConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: RepositoryProviderDefinition | null;
}

const SettingsProviderModal = ({
  isOpen,
  onClose,
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
}: SettingsProviderModalProps) => {
  const [expandedProviderKind, setExpandedProviderKind] = React.useState<RepositoryProviderKind | ''>(config.provider);

  React.useEffect(() => {
    setExpandedProviderKind(config.provider);
  }, [config.provider]);

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuracion de provider"
      description="Selecciona la fuente principal del workspace y completa su conexion sin cargar la vista principal."
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
          </RepositoryProviderCard>
        ))}
      </div>
    </SettingsModal>
  );
};

export default SettingsProviderModal;
