import React from 'react';
import { BoltIcon, CircleStackIcon, CpuChipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ConnectionPanel from '../../dashboard/components/ConnectionPanel';
import ConnectionSummary from '../../dashboard/components/ConnectionSummary';
import { repositoryProviders } from '../../repository-source/providers';
import type { RepositoryProviderKind } from '../../../../types/repository';
import type { CodexIntegrationConfig, DashboardSummary, SavedConnectionConfig } from '../../dashboard/types';
import type { RepositoryProviderDefinition } from '../../../../types/repository';
import type { AzureDiagnostics } from '../../dashboard/types';
import type { RepositoryProject, RepositorySummary } from '../../../../types/repository';
import CodexIntegrationCard from './CodexIntegrationCard';
import RepositoryProviderCard from './RepositoryProviderCard';
import {
  SettingsSectionCard,
  SettingsStatTile,
  SettingsStatusBadge,
} from './SettingsPrimitives';

export const SettingsHero = ({
  isConnectionReady,
  isCodexReady,
}: {
  isConnectionReady: boolean;
  isCodexReady: boolean;
}) => {
  const availableProviders = repositoryProviders.filter((provider) => provider.status === 'available').length;
  const configuredIntegrations = Number(isConnectionReady) + Number(isCodexReady);

  return (
    <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_28%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)] p-8 text-white shadow-[0_35px_100px_-45px_rgba(2,6,23,0.95)]">
      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Settings</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Configuracion de fuentes e integraciones</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Este es el hub para providers de repositorios e integraciones transversales. Azure DevOps, GitHub y GitLab quedan operativos;
            Bitbucket entra al backlog futuro.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <HeroMetric
            icon={<CircleStackIcon className="h-5 w-5" />}
            label="Providers operativos"
            value={`${availableProviders}`}
            detail="Azure DevOps, GitHub y GitLab"
          />
          <HeroMetric
            icon={<CpuChipIcon className="h-5 w-5" />}
            label="Integraciones listas"
            value={`${configuredIntegrations}/2`}
            detail="Provider activo + Codex"
          />
          <HeroMetric
            icon={<ShieldCheckIcon className="h-5 w-5" />}
            label="Persistencia segura"
            value="Sesion"
            detail="Secrets fuera de disco"
          />
        </div>
      </div>
    </section>
  );
};

export const SettingsOperationalSection = ({
  activeProvider,
  activeProviderName,
  config,
  selectedProjectName,
  selectedRepositoryName,
  summary,
  isConnectionReady,
  isCodexReady,
}: {
  activeProvider: RepositoryProviderDefinition | null;
  activeProviderName: string;
  config: SavedConnectionConfig;
  selectedProjectName: string | null;
  selectedRepositoryName: string | null;
  summary: DashboardSummary;
  isConnectionReady: boolean;
  isCodexReady: boolean;
}) => (
  <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
    <SettingsSectionCard
      eyebrow="Prioridad 1"
      title="Resumen operativo"
      description="Empieza aquí: esta card te dice si el workspace está listo o qué pieza falta antes de entrar al dashboard o lanzar un análisis."
      badge={<SettingsStatusBadge tone={isConnectionReady ? 'emerald' : 'amber'} label={isConnectionReady ? 'Workspace operativo' : 'Faltan pasos'} />}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsStatTile
            label="Provider activo"
            value={config.provider ? activeProviderName : 'No seleccionado'}
            description="Fuente primaria de repositorios y PRs para esta sesion."
          />
          <SettingsStatTile
            label="Conexion"
            value={isConnectionReady ? 'OK' : 'Pendiente'}
            description={isConnectionReady ? 'Sesion autenticada y sincronizacion exitosa.' : 'Falta autenticar o sincronizar el provider activo.'}
          />
          <SettingsStatTile
            label="Scope actual"
            value={selectedRepositoryName || selectedProjectName || 'Global'}
            description={summary.scopeLabel}
          />
          <SettingsStatTile
            label="Codex"
            value={isCodexReady ? 'Listo' : 'Pendiente'}
            description="Disponibilidad de analisis AI sobre ramas exactas."
          />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Siguiente accion</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">
            {!config.provider
              ? 'Selecciona un provider'
              : !isConnectionReady
                ? 'Conecta y sincroniza la fuente'
                : !isCodexReady
                  ? 'Completa la integración Codex'
                  : 'El workspace está listo'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {!config.provider
              ? 'Elige Azure DevOps, GitHub o GitLab para definir el contexto operativo.'
              : !isConnectionReady
                ? 'Autentica el provider activo y ejecuta una sincronización inicial.'
                : !isCodexReady
                  ? 'Configura la API key y políticas de Codex para habilitar Repository Analysis.'
                  : 'Puedes navegar al dashboard o ejecutar un análisis de repositorio con contexto completo.'}
          </p>
        </div>
      </div>
    </SettingsSectionCard>

    <div className="space-y-6">
      <ConnectionSummary
        providerKind={activeProvider?.kind}
        providerName={activeProviderName}
        scopeLabel={summary.scopeLabel}
        projectName={selectedProjectName}
        repositoryName={selectedRepositoryName}
        isConnected={isConnectionReady}
        empty={!config.provider}
        actionLabel="Dashboard"
        actionTo="/"
      />

      <SettingsSectionCard
        eyebrow="Politica"
        title="Persistencia y sesion"
        description="Esta app distingue entre configuracion reutilizable y secretos efimeros para no mezclar comodidad con riesgo."
        actions={<BoltIcon className="h-5 w-5 text-sky-600" />}
      >
        <div className="space-y-2 text-sm leading-6 text-slate-600">
          <p>Las fuentes de repositorios no persisten organizacion, proyecto ni repositorio al cerrar la app.</p>
          <p>Se guarda solo en sesion: el token del provider activo, para no persistir secretos ni contexto sensible en disco.</p>
          <p>Este mismo patron se aplica tambien a Codex: configuracion persistida y API key solo en sesion.</p>
        </div>
      </SettingsSectionCard>
    </div>
  </section>
);

export const SettingsIntegrationsSection = ({
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
}) => {
  const [expandedProviderKind, setExpandedProviderKind] = React.useState<RepositoryProviderKind | ''>(config.provider);

  React.useEffect(() => {
    setExpandedProviderKind(config.provider);
  }, [config.provider]);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="space-y-6">
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
          description="Primero configura la fuente principal del workspace. Después puedes cambiar de provider sin salir de Settings."
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
      </div>
    </section>
  );
};

export const SettingsDiagnosticsSection = ({
  activeProviderName,
  config,
  diagnostics,
  hasCredentialsInSession,
  hasSuccessfulConnection,
}: {
  activeProviderName: string;
  config: SavedConnectionConfig;
  diagnostics: AzureDiagnostics;
  hasCredentialsInSession: boolean;
  hasSuccessfulConnection: boolean;
}) => (
  <SettingsSectionCard
    eyebrow="Prioridad 3"
    title="Diagnostico del provider"
    description="Revisa aquí errores de autenticación, scope o resolución de rutas antes de ir a consola."
    badge={<SettingsStatusBadge tone={diagnostics.lastError ? 'rose' : 'slate'} label={diagnostics.lastError ? 'Con error' : 'Sin error activo'} />}
  >
    <div className="space-y-2 text-sm leading-6 text-slate-600">
      <p><span className="font-medium text-slate-900">Provider:</span> {config.provider ? activeProviderName : '-'}</p>
      <p><span className="font-medium text-slate-900">Operacion:</span> {diagnostics.operation || 'sin ejecucion'}</p>
      <p><span className="font-medium text-slate-900">Organization:</span> {diagnostics.organization || '-'}</p>
      <p><span className="font-medium text-slate-900">Project:</span> {diagnostics.project || '-'}</p>
      <p><span className="font-medium text-slate-900">Repository ID:</span> {diagnostics.repositoryId || '-'}</p>
      <p><span className="font-medium text-slate-900">Request path:</span> {diagnostics.requestPath || '-'}</p>
      <p><span className="font-medium text-slate-900">PAT en sesion:</span> {hasCredentialsInSession ? 'si' : 'no'}</p>
      <p><span className="font-medium text-slate-900">Conexion exitosa:</span> {hasSuccessfulConnection ? 'si' : 'no'}</p>
    </div>
    {diagnostics.lastError ? (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
        {diagnostics.lastError}
      </div>
    ) : null}
  </SettingsSectionCard>
);

export const SettingsRoadmapSection = () => (
  <SettingsSectionCard
    eyebrow="Roadmap"
    title="Integraciones futuras"
    description="Lo que venga después debe caer aquí, con la misma jerarquía visual y sin competir con la configuración operativa."
  >
    <div className="space-y-4">
      <IntegrationCard
        title="Security Providers"
        description="Conectores a scanners externos, SAST/DAST y fuentes de vulnerabilidades."
        status="Planned"
      />
      <IntegrationCard
        title="Notifications"
        description="Canales como Teams, Slack o email con reglas por riesgo y SLA."
        status="Planned"
      />
    </div>
  </SettingsSectionCard>
);

interface HeroMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}

const HeroMetric = ({ icon, label, value, detail }: HeroMetricProps) => (
  <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
    <div className="flex items-center gap-2 text-sky-300">
      {icon}
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">{label}</p>
    </div>
    <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
  </article>
);

interface IntegrationCardProps {
  title: string;
  description: string;
  status: string;
}

const IntegrationCard = ({ title, description, status }: IntegrationCardProps) => (
  <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">{status}</span>
    </div>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
  </article>
);
