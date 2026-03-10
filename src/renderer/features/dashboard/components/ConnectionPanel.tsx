import React from 'react';
import type { AzureProject, AzureRepository } from '../../../../types/azure';
import ConnectionHelp from './ConnectionHelp';
import type { SavedConnectionConfig } from '../types';

interface ConnectionPanelProps {
  providerName: string;
  providerKind: SavedConnectionConfig['provider'];
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
  const organizationLabel = isGitHub ? 'Owner / Organization' : 'Organization';
  const projectLabel = isGitHub ? 'Repositorio' : 'Proyecto';
  const tokenLabel = isGitHub ? 'Personal Access Token / Fine-grained token' : 'Personal Access Token';
  const loadLabel = isGitHub ? 'Cargar repositorios' : 'Cargar proyectos';
  const projectPlaceholder = isGitHub ? 'nombre-del-repo' : 'escribe el nombre del proyecto';

  return (
  <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-slate-900">Conexión {providerName}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isGitHub
          ? `Define el alcance exacto para ${providerName}: owner/organización y repositorio.`
          : `Define el alcance exacto para ${providerName}: organización, proyecto y repositorio.`}
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label={organizationLabel}
        value={config.organization}
        placeholder={isGitHub ? 'mi-org-o-user' : 'mi-organizacion'}
        onChange={(value) => onConfigChange('organization', value)}
      />
      <div className="space-y-2">
        <Field
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
        <label className="space-y-2 text-sm text-slate-600">
          <span>{projectLabel}</span>
          <select
            value={config.project || ''}
            onChange={(event) => void onSelectProject(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
            disabled={projectsLoading || projects.length === 0}
          >
            <option value="">{isGitHub ? 'Todos los repositorios del owner' : 'Selecciona un proyecto'}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">
            {projectsLoading
              ? `${loadLabel}...`
              : `${projects.length} ${isGitHub ? 'repositorios' : 'proyectos'} disponibles`}
          </p>
        </label>
      ) : (
        <div className="space-y-2">
          <Field
            label={projectLabel}
            value={config.project || ''}
            placeholder={isGitHub ? 'deja vacio para todos los repositorios' : projectPlaceholder}
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
      {isGitHub ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          En GitHub el repositorio seleccionado define el scope del dashboard y del analisis por rama.
        </div>
      ) : (
        <label className="space-y-2 text-sm text-slate-600">
          <span>Repositorio</span>
          <select
            value={config.repositoryId || ''}
            onChange={(event) => onConfigChange('repositoryId', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
            disabled={repositoriesLoading || repositories.length === 0}
          >
            <option value="">Todos los repositorios del proyecto</option>
            {repositories.map((repository) => (
              <option key={repository.id} value={repository.id}>
                {repository.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">
            {repositoriesLoading ? 'Cargando repositorios...' : `${repositories.length} repositorios disponibles`}
          </p>
        </label>
      )}
      <Field
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

    <div className="mt-5 flex items-center justify-end">
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isLoading ? 'Conectando...' : 'Conectar y sincronizar'}
      </button>
    </div>

    {error ? (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    ) : null}
    {projectDiscoveryWarning && projects.length === 0 ? (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {projectDiscoveryWarning}
      </div>
    ) : null}
    {projects.length > 0 && !manualProjectEntry ? (
      <div className="mt-4 text-right">
        <button
          type="button"
          onClick={() => setManualProjectEntry(true)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {isGitHub ? 'Ingresar repositorio manualmente' : 'Ingresar proyecto manualmente'}
        </button>
      </div>
    ) : null}
  </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  span?: string;
}

const Field = ({ label, value, placeholder, onChange, type = 'text', span = '' }: FieldProps) => (
  <label className={`space-y-2 text-sm text-slate-600 ${span}`}>
    <span>{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
      placeholder={placeholder}
    />
  </label>
);

export default ConnectionPanel;
