import React from 'react';
import type { RepositoryProject, RepositorySummary } from '../../../../../types/repository';
import {
  SettingsField,
  SettingsSelectField,
} from '../../../../ui/configuration/ConfigurationPrimitives';
import type { SavedConnectionConfig } from '../../types';

interface ConnectionProjectScopeProps {
  projects: RepositoryProject[];
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
}: ConnectionProjectScopeProps) {
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

interface ConnectionRepositoryScopeProps {
  isNamespaceProvider: boolean;
  isGitHub: boolean;
  repositoriesLoading: boolean;
  repositories: RepositorySummary[];
  config: SavedConnectionConfig;
  onConfigChange: (name: keyof SavedConnectionConfig, value: string) => void;
}

export function ConnectionRepositoryScope({
  isNamespaceProvider,
  isGitHub,
  repositoriesLoading,
  repositories,
  config,
  onConfigChange,
}: ConnectionRepositoryScopeProps) {
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
