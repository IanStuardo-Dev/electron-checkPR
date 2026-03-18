import React from 'react';
import type { RepositoryProviderDefinition } from '../../../../../types/repository';
import { RepositorySourceProviderCatalog } from '../../../repository-source';
import RepositoryProviderCard from './RepositoryProviderCard';
import { SettingsModal } from '../../../../ui/configuration/ConfigurationPrimitives';
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
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuracion de provider"
      description="Selecciona la fuente principal del workspace y completa su conexion sin cargar la vista principal."
    >
      <div className="grid gap-4">
        <RepositorySourceProviderCatalog
          activeProvider={activeProvider}
          activeProviderName={activeProviderName}
          config={config}
          error={error}
          isConnectionReady={isConnectionReady}
          isLoading={isLoading}
          projects={projects}
          projectsLoading={projectsLoading}
          projectDiscoveryWarning={projectDiscoveryWarning}
          repositories={repositories}
          repositoriesLoading={repositoriesLoading}
          discoverProjects={discoverProjects}
          selectProject={selectProject}
          updateConfig={updateConfig}
          refreshPullRequests={refreshPullRequests}
          renderProviderCard={(providerCardProps) => (
            <RepositoryProviderCard
              key={providerCardProps.provider.kind}
              {...providerCardProps}
            />
          )}
        />
      </div>
    </SettingsModal>
  );
};

export default SettingsProviderModal;
