import React from 'react';
import type { AzureProject, AzureRepository } from '../../../../types/azure';
import type { RepositoryProviderKind } from '../../../../types/repository';
import ConnectionHelp from './ConnectionHelp';
import {
  ConnectionFeedback,
  ConnectionIdentityFields,
  ConnectionProjectScope,
  ConnectionRepositoryScope,
} from './ConnectionPanelSections';
import type { SavedConnectionConfig } from '../types';
import {
  SettingsField,
  SettingsSectionCard,
  SettingsStatusBadge,
} from '../../settings/components/SettingsPrimitives';

interface ConnectionPanelProps {
  providerName: string;
  providerKind: RepositoryProviderKind;
  isConnected: boolean;
  config: SavedConnectionConfig;
  error: string | null;
  projectDiscoveryWarning: string | null;
  isLoading: boolean;
  projects: AzureProject[];
  projectsLoading: boolean;
  repositories: AzureRepository[];
  repositoriesLoading: boolean;
  onDiscoverProjects: () => void;
  onSelectProject: (project: string) => void;
  onConfigChange: (name: keyof SavedConnectionConfig, value: string) => void;
  onRefresh: () => void;
}

const ConnectionPanel = ({
  providerName,
  providerKind,
  isConnected,
  config,
  error,
  projectDiscoveryWarning,
  isLoading,
  projects,
  projectsLoading,
  repositories,
  repositoriesLoading,
  onDiscoverProjects,
  onSelectProject,
  onConfigChange,
  onRefresh,
}: ConnectionPanelProps) => {
  const [manualProjectEntry, setManualProjectEntry] = React.useState(false);

  React.useEffect(() => {
    if (projects.length > 0) {
      setManualProjectEntry(false);
    }
  }, [projects.length]);

  const isGitHub = providerKind === 'github';
  const isGitLab = providerKind === 'gitlab';
  const isNamespaceProvider = isGitHub || isGitLab;
  const organizationLabel = isGitHub
    ? 'Owner / Organization'
    : isGitLab
      ? 'Group / Namespace'
      : 'Organization';
  const projectLabel = isNamespaceProvider ? 'Repositorio / Proyecto' : 'Proyecto';
  const tokenLabel = isGitHub ? 'Personal Access Token / Fine-grained token' : 'Personal Access Token';
  const loadLabel = isNamespaceProvider ? 'Cargar proyectos' : 'Cargar proyectos';
  const projectPlaceholder = isGitHub
    ? 'nombre-del-repo'
    : isGitLab
      ? 'grupo/proyecto'
      : 'escribe el nombre del proyecto';

  return (
    <SettingsSectionCard
      title={`Configuracion ${providerName}`}
      description={
        isGitHub
          ? `Define el alcance exacto para ${providerName}: owner u organizacion y repositorio.`
          : isGitLab
            ? `Define el alcance exacto para ${providerName}: namespace y proyecto.`
            : `Define el alcance exacto para ${providerName}: organizacion, proyecto y repositorio.`
      }
      badge={<SettingsStatusBadge tone={isConnected ? 'emerald' : 'amber'} label={isConnected ? 'Conectado' : 'Pendiente'} />}
      actions={(
        !isConnected ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
          >
            {isLoading ? 'Conectando...' : 'Conectar y sincronizar'}
          </button>
        ) : undefined
      )}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ConnectionIdentityFields
          organizationLabel={organizationLabel}
          tokenLabel={tokenLabel}
          organizationPlaceholder={isGitHub ? 'mi-org-o-user' : isGitLab ? 'mi-grupo-o-namespace' : 'mi-organizacion'}
          tokenPlaceholder={isGitHub ? 'ghp_...' : 'azdpat...'}
          config={config}
          projectsLoading={projectsLoading}
          loadLabel={loadLabel}
          onConfigChange={onConfigChange}
          onDiscoverProjects={onDiscoverProjects}
        />
        <ConnectionProjectScope
          projects={projects}
          manualProjectEntry={manualProjectEntry}
          config={config}
          projectLabel={projectLabel}
          projectsLoading={projectsLoading}
          projectPlaceholder={isGitHub
            ? 'deja vacio para todos los repositorios'
            : isGitLab
              ? 'deja vacio para todos los proyectos'
              : projectPlaceholder}
          isGitHub={isGitHub}
          isGitLab={isGitLab}
          onSelectProject={onSelectProject}
          onManualMode={() => setManualProjectEntry(true)}
          onSelectionMode={() => setManualProjectEntry(false)}
        />
        <ConnectionRepositoryScope
          isNamespaceProvider={isNamespaceProvider}
          isGitHub={isGitHub}
          repositoriesLoading={repositoriesLoading}
          repositories={repositories}
          config={config}
          onConfigChange={onConfigChange}
        />
        <SettingsField
          label="Reviewer a priorizar opcional"
          value={config.targetReviewer || ''}
          placeholder="nombre o correo"
          span="xl:col-span-2"
          onChange={(value) => onConfigChange('targetReviewer', value)}
        />
      </div>

      <div className="mt-5">
        <ConnectionHelp provider={providerKind} />
      </div>

      <ConnectionFeedback
        providerName={providerName}
        isConnected={isConnected}
        error={error}
        projectDiscoveryWarning={projectDiscoveryWarning}
        hasProjects={projects.length > 0}
      />
    </SettingsSectionCard>
  );
};

export default ConnectionPanel;
