import React from 'react';
import type { AzureProject, AzureRepository } from '../../../../types/azure';
import type { RepositoryProviderKind } from '../../../../types/repository';
import ConnectionHelp from './ConnectionHelp';
import type { SavedConnectionConfig } from '../types';
import {
  SettingsField,
  SettingsNotice,
  SettingsSectionCard,
  SettingsSelectField,
  SettingsStatusBadge,
  SettingsToggleCard,
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
            className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? 'Conectando...' : 'Conectar y sincronizar'}
          </button>
        ) : undefined
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsField
        label={organizationLabel}
        value={config.organization}
        placeholder={isGitHub ? 'mi-org-o-user' : isGitLab ? 'mi-grupo-o-namespace' : 'mi-organizacion'}
        onChange={(value) => onConfigChange('organization', value)}
      />
        <div className="space-y-3">
          <SettingsField
          label={tokenLabel}
          value={config.personalAccessToken}
          placeholder={isGitHub ? 'ghp_...' : 'azdpat...'}
          type="password"
          onChange={(value) => onConfigChange('personalAccessToken', value)}
        />
          <button
            type="button"
            onClick={onDiscoverProjects}
            disabled={projectsLoading || !config.organization || !config.personalAccessToken}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {projectsLoading ? `${loadLabel}...` : loadLabel}
          </button>
        </div>
      {projects.length > 0 && !manualProjectEntry ? (
        <SettingsSelectField
          label={projectLabel}
          value={config.project || ''}
          onChange={(value) => void onSelectProject(value)}
          disabled={projectsLoading || projects.length === 0}
          options={[
            {
              value: '',
              label: isGitHub
                ? 'Todos los repositorios del owner'
                : isGitLab
                  ? 'Todos los proyectos del namespace'
                  : 'Selecciona un proyecto',
            },
            ...projects.map((project) => ({
              value: project.name,
              label: project.name,
            })),
          ]}
          hint={projectsLoading
            ? `${loadLabel}...`
            : `${projects.length} proyectos disponibles`}
        />
      ) : (
        <div className="space-y-2">
          <SettingsField
            label={projectLabel}
            value={config.project || ''}
            placeholder={isGitHub
              ? 'deja vacio para todos los repositorios'
              : isGitLab
                ? 'deja vacio para todos los proyectos'
                : projectPlaceholder}
            onChange={(value) => void onSelectProject(value)}
          />
          {projects.length > 0 ? (
            <button
              type="button"
              onClick={() => setManualProjectEntry(false)}
              className="text-xs font-medium text-sky-700 hover:text-sky-800"
            >
              Volver a seleccion de proyectos
            </button>
          ) : null}
        </div>
      )}
      {isNamespaceProvider ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {isGitHub
            ? 'En GitHub el repositorio seleccionado define el scope del dashboard y del analisis por rama.'
            : 'En GitLab el proyecto seleccionado define el scope del dashboard y del analisis por rama.'}
        </div>
      ) : (
        <SettingsSelectField
          label="Repositorio"
          value={config.repositoryId || ''}
          onChange={(value) => onConfigChange('repositoryId', value)}
          disabled={repositoriesLoading || repositories.length === 0}
          options={[
            { value: '', label: 'Todos los repositorios del proyecto' },
            ...repositories.map((repository) => ({
              value: repository.id,
              label: repository.name,
            })),
          ]}
          hint={repositoriesLoading ? 'Cargando repositorios...' : `${repositories.length} repositorios disponibles`}
        />
      )}
        <SettingsField
        label="Reviewer a priorizar opcional"
        value={config.targetReviewer || ''}
        placeholder="nombre o correo"
        span="md:col-span-2"
        onChange={(value) => onConfigChange('targetReviewer', value)}
      />
      </div>

      <div className="mt-5">
        <ConnectionHelp provider={providerKind} />
      </div>

      {isConnected ? (
        <div className="mt-5">
          <SettingsNotice tone="success">
            <span className="font-medium">Conectado correctamente.</span> El provider {providerName} esta sincronizado y listo para usarse.
          </SettingsNotice>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {error ? (
          <SettingsNotice tone="error">
            {error}
          </SettingsNotice>
        ) : null}
        {projectDiscoveryWarning && projects.length === 0 ? (
          <SettingsNotice tone="warning">
            {projectDiscoveryWarning}
          </SettingsNotice>
        ) : null}
      </div>

      {projects.length > 0 && !manualProjectEntry ? (
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={() => setManualProjectEntry(true)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Ingresar proyecto manualmente
          </button>
        </div>
      ) : null}
    </SettingsSectionCard>
  );
};

export default ConnectionPanel;
