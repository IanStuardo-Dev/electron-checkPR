import React from 'react';
import type { AzureProject, AzureRepository } from '../../../../types/azure';
import {
  SettingsField,
  SettingsNotice,
  SettingsSelectField,
} from '../../settings/components/SettingsPrimitives';
import type { SavedConnectionConfig } from '../types';

export function ConnectionIdentityFields({
  organizationLabel,
  tokenLabel,
  organizationPlaceholder,
  tokenPlaceholder,
  config,
  projectsLoading,
  loadLabel,
  onConfigChange,
  onDiscoverProjects,
}: {
  organizationLabel: string;
  tokenLabel: string;
  organizationPlaceholder: string;
  tokenPlaceholder: string;
  config: SavedConnectionConfig;
  projectsLoading: boolean;
  loadLabel: string;
  onConfigChange: (name: keyof SavedConnectionConfig, value: string) => void;
  onDiscoverProjects: () => void;
}) {
  return (
    <>
      <SettingsField
        label={organizationLabel}
        value={config.organization}
        placeholder={organizationPlaceholder}
        onChange={(value) => onConfigChange('organization', value)}
      />
      <div className="space-y-3">
        <SettingsField
          label={tokenLabel}
          value={config.personalAccessToken}
          placeholder={tokenPlaceholder}
          type="password"
          onChange={(value) => onConfigChange('personalAccessToken', value)}
        />
        <button
          type="button"
          onClick={onDiscoverProjects}
          disabled={projectsLoading || !config.organization || !config.personalAccessToken}
          className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {projectsLoading ? `${loadLabel}...` : loadLabel}
        </button>
      </div>
    </>
  );
}

export function ConnectionProjectScope({
  projects,
  manualProjectEntry,
  config,
  projectLabel,
  projectsLoading,
  projectPlaceholder,
  isGitHub,
  isGitLab,
  onSelectProject,
  onManualMode,
  onSelectionMode,
}: {
  projects: AzureProject[];
  manualProjectEntry: boolean;
  config: SavedConnectionConfig;
  projectLabel: string;
  projectsLoading: boolean;
  projectPlaceholder: string;
  isGitHub: boolean;
  isGitLab: boolean;
  onSelectProject: (project: string) => void;
  onManualMode: () => void;
  onSelectionMode: () => void;
}) {
  if (projects.length > 0 && !manualProjectEntry) {
    return (
      <>
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
          hint={projectsLoading ? 'Cargando proyectos...' : `${projects.length} proyectos disponibles`}
        />
        <div className="text-left sm:text-right xl:col-span-2">
          <button
            type="button"
            onClick={onManualMode}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Ingresar proyecto manualmente
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-2">
      <SettingsField
        label={projectLabel}
        value={config.project || ''}
        placeholder={projectPlaceholder}
        onChange={(value) => void onSelectProject(value)}
      />
      {projects.length > 0 ? (
        <button
          type="button"
          onClick={onSelectionMode}
          className="text-xs font-medium text-sky-700 hover:text-sky-800"
        >
          Volver a seleccion de proyectos
        </button>
      ) : null}
    </div>
  );
}

export function ConnectionRepositoryScope({
  isNamespaceProvider,
  isGitHub,
  repositoriesLoading,
  repositories,
  config,
  onConfigChange,
}: {
  isNamespaceProvider: boolean;
  isGitHub: boolean;
  repositoriesLoading: boolean;
  repositories: AzureRepository[];
  config: SavedConnectionConfig;
  onConfigChange: (name: keyof SavedConnectionConfig, value: string) => void;
}) {
  if (isNamespaceProvider) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        {isGitHub
          ? 'En GitHub el repositorio seleccionado define el scope del dashboard y del analisis por rama.'
          : 'En GitLab el proyecto seleccionado define el scope del dashboard y del analisis por rama.'}
      </div>
    );
  }

  return (
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
  );
}

export function ConnectionFeedback({
  providerName,
  isConnected,
  error,
  projectDiscoveryWarning,
  hasProjects,
}: {
  providerName: string;
  isConnected: boolean;
  error: string | null;
  projectDiscoveryWarning: string | null;
  hasProjects: boolean;
}) {
  return (
    <>
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
        {projectDiscoveryWarning && !hasProjects ? (
          <SettingsNotice tone="warning">
            {projectDiscoveryWarning}
          </SettingsNotice>
        ) : null}
      </div>
    </>
  );
}
