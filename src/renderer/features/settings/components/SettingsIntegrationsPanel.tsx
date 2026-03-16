import React from 'react';
import type { RepositoryProviderKind, RepositoryProviderDefinition, RepositoryProject, RepositorySummary } from '../../../../types/repository';
import type { CodexIntegrationConfig, DashboardSummary, SavedConnectionConfig } from '../../dashboard/types';
import ConnectionPanel from '../../dashboard/components/ConnectionPanel';
import { repositoryProviders } from '../../repository-source/providers';
import CodexIntegrationCard from './CodexIntegrationCard';
import GlobalSnapshotPolicyCard from './GlobalSnapshotPolicyCard';
import RepositoryProviderCard from './RepositoryProviderCard';
import { SettingsActionCard, SettingsModal, SettingsSectionCard, SettingsStatusBadge } from './SettingsPrimitives';

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
  const [isProviderModalOpen, setIsProviderModalOpen] = React.useState(false);
  const [isCodexModalOpen, setIsCodexModalOpen] = React.useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = React.useState(false);

  React.useEffect(() => {
    setExpandedProviderKind(config.provider);
  }, [config.provider]);

  const activeProviderLabel = config.provider ? activeProviderName : 'No seleccionado';
  const snapshotRulesCount = codexConfig.snapshotPolicy.excludedPathPatterns
    .split('\n')
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .length;

  return (
    <section className="space-y-6">
      <SettingsSectionCard
        eyebrow="Configuracion"
        title="Integraciones y reglas"
        description="La vista principal muestra solo el estado actual. Abre cada modal cuando necesites editar providers, integracion AI o politicas globales."
        badge={<SettingsStatusBadge tone="sky" label="Experiencia simplificada" />}
      >
        <div className="grid gap-4 lg:auto-rows-fr lg:grid-cols-3">
          <SettingsActionCard
            eyebrow="Provider"
            title="Fuente principal"
            description="Selecciona el provider activo y ajusta alcance o conexion solo cuando realmente lo necesites."
            badge={<SettingsStatusBadge tone={isConnectionReady ? 'emerald' : 'amber'} label={isConnectionReady ? 'Conectado' : 'Pendiente'} />}
            summaryLabel="Activo"
            summaryValue={activeProviderLabel}
            summaryDescription={selectedRepositoryName || selectedProjectName || summary.scopeLabel}
            actionLabel="Abrir configuracion"
            onAction={() => setIsProviderModalOpen(true)}
          />

          <SettingsActionCard
            eyebrow="Codex"
            title="Analisis AI"
            description="Mantiene a mano el estado de la integracion sin exponer todos los campos en la vista principal."
            badge={<SettingsStatusBadge tone={isCodexReady ? 'emerald' : 'amber'} label={isCodexReady ? 'Listo' : 'Pendiente'} />}
            summaryLabel="Modelo"
            summaryValue={codexConfig.model}
            summaryDescription={codexConfig.enabled ? 'Integracion habilitada para analisis.' : 'Integracion deshabilitada en esta sesion.'}
            actionLabel="Abrir configuracion"
            onAction={() => setIsCodexModalOpen(true)}
          />

          <SettingsActionCard
            eyebrow="Snapshots"
            title="Politica global"
            description="Agrupa reglas base y modo estricto sin mezclar este detalle con la operacion diaria."
            badge={<SettingsStatusBadge tone="sky" label={`${snapshotRulesCount} reglas`} />}
            summaryLabel="Modo"
            summaryValue={codexConfig.snapshotPolicy.strictMode ? 'Estricto' : 'Flexible'}
            summaryDescription="Base comun para Repository Analysis y PR AI Review."
            actionLabel="Editar reglas"
            onAction={() => setIsSnapshotModalOpen(true)}
          />
        </div>
      </SettingsSectionCard>

      <SettingsModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
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
      </SettingsModal>

      <SettingsModal
        isOpen={isCodexModalOpen}
        onClose={() => setIsCodexModalOpen(false)}
        title="Configuracion de Codex"
        description="Toda la configuracion de analisis AI vive aqui para mantener Settings simple y enfocada."
      >
        <CodexIntegrationCard
          config={codexConfig}
          isReady={isCodexReady}
          onChange={updateCodexConfig}
        />
      </SettingsModal>

      <SettingsModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Reglas globales de snapshot"
        description="Ajusta exclusiones base y modo estricto sin mezclar este detalle con la vista principal."
      >
        <GlobalSnapshotPolicyCard
          snapshotPolicy={codexConfig.snapshotPolicy}
          onChange={(value) => updateCodexConfig('snapshotPolicy', value)}
        />
      </SettingsModal>
    </section>
  );
}
