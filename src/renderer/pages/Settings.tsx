import React from 'react';
import { motion } from 'framer-motion';
import ConnectionPanel from '../features/dashboard/components/ConnectionPanel';
import ConnectionSummary from '../features/dashboard/components/ConnectionSummary';
import { useRepositorySource } from '../features/dashboard/hooks/useAzurePullRequests';
import { repositoryProviders } from '../features/repository-source/providers';
import CodexIntegrationCard from '../features/settings/components/CodexIntegrationCard';
import RepositoryProviderCard from '../features/settings/components/RepositoryProviderCard';
import { useCodexSettings } from '../features/settings/hooks/useCodexSettings';
import type { RepositoryProviderKind } from '../../types/repository';

const Settings = () => {
  const {
    activeProvider,
    config,
    error,
    hasCredentialsInSession,
    hasSuccessfulConnection,
    isConnectionReady,
    isLoading,
    projects,
    projectsLoading,
    projectDiscoveryWarning,
    repositories,
    repositoriesLoading,
    diagnostics,
    selectedProjectName,
    selectedRepositoryName,
    summary,
    updateConfig,
    discoverProjects,
    selectProject,
    refreshPullRequests,
  } = useRepositorySource();
  const {
    config: codexConfig,
    isReady: isCodexReady,
    updateConfig: updateCodexConfig,
  } = useCodexSettings();
  const [expandedProviderKind, setExpandedProviderKind] = React.useState<RepositoryProviderKind | ''>(config.provider);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Settings</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Configuracion de fuentes e integraciones</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Este es el hub para providers de repositorios e integraciones transversales. Azure DevOps y GitHub quedan operativos;
          GitLab queda preparado para la siguiente fase, y Bitbucket entra al backlog futuro.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <ConnectionSummary
            providerKind={activeProvider.kind}
            providerName={activeProvider.name}
            scopeLabel={summary.scopeLabel}
            projectName={selectedProjectName}
            repositoryName={selectedRepositoryName}
            isConnected={isConnectionReady}
            compact
            expandable
            expanded={expandedProviderKind === activeProvider.kind}
            onToggleExpand={() => setExpandedProviderKind((current) => (current === activeProvider.kind ? '' : activeProvider.kind))}
          />

          {repositoryProviders.map((provider) => (
            <RepositoryProviderCard
              key={provider.kind}
              provider={provider}
              isActive={provider.kind === activeProvider.kind}
              isConfigured={provider.kind === activeProvider.kind && isConnectionReady}
              expanded={provider.kind === activeProvider.kind && expandedProviderKind === provider.kind}
              onToggleExpand={provider.status === 'available' && provider.kind === activeProvider.kind
                ? () => setExpandedProviderKind((current) => (current === provider.kind ? '' : provider.kind))
                : undefined}
              onActivate={provider.status === 'available' && provider.kind !== activeProvider.kind
                ? () => {
                  updateConfig('provider', provider.kind);
                  setExpandedProviderKind(provider.kind);
                }
                : undefined}
            >
              {provider.kind === activeProvider.kind ? (
                <ConnectionPanel
                  providerName={activeProvider.name}
                  providerKind={activeProvider.kind}
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

        <div className="space-y-6">
          <ConnectionSummary
            providerKind={activeProvider.kind}
            providerName={activeProvider.name}
            scopeLabel={summary.scopeLabel}
            projectName={selectedProjectName}
            repositoryName={selectedRepositoryName}
            isConnected={isConnectionReady}
            actionLabel="Dashboard"
            actionTo="/"
          />

          <CodexIntegrationCard
            config={codexConfig}
            isReady={isCodexReady}
            onChange={updateCodexConfig}
          />

          <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Integraciones futuras</h2>
            <div className="mt-4 space-y-4">
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
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Persistencia</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Las fuentes de repositorios no persisten organizacion, proyecto ni repositorio al cerrar la app.</p>
              <p>Se guarda solo en sesion: el token del provider activo, para no persistir secretos ni contexto sensible en disco.</p>
              <p>Este mismo patron se aplica tambien a Codex: configuracion persistida y API key solo en sesion.</p>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Diagnostico del provider</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Provider:</span> {activeProvider.name}</p>
              <p><span className="font-medium text-slate-900">Operacion:</span> {diagnostics.operation || 'sin ejecucion'}</p>
              <p><span className="font-medium text-slate-900">Organization:</span> {diagnostics.organization || '-'}</p>
              <p><span className="font-medium text-slate-900">Project:</span> {diagnostics.project || '-'}</p>
              <p><span className="font-medium text-slate-900">Repository ID:</span> {diagnostics.repositoryId || '-'}</p>
              <p><span className="font-medium text-slate-900">Request path:</span> {diagnostics.requestPath || '-'}</p>
              <p><span className="font-medium text-slate-900">PAT en sesion:</span> {hasCredentialsInSession ? 'si' : 'no'}</p>
              <p><span className="font-medium text-slate-900">Conexion exitosa:</span> {hasSuccessfulConnection ? 'si' : 'no'}</p>
            </div>
            {diagnostics.lastError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {diagnostics.lastError}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </motion.div>
  );
};

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

export default Settings;
