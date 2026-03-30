import React from 'react';
import type { RepositoryProviderDefinition } from '../../../../../types/repository';
import type { DashboardSummary } from '../../../../shared/dashboard/summary.types';
import type { CodexIntegrationConfig } from '../../types';
import CodexIntegrationCard from './CodexIntegrationCard';
import GlobalSnapshotPolicyCard from './GlobalSnapshotPolicyCard';
import SettingsIntegrationActionCards from './SettingsIntegrationActionCards';
import SettingsProviderModal from './SettingsProviderModal';
import SettingsSectionModal from './SettingsSectionModal';
import type { SettingsProviderConnectionProps } from './SettingsProvider.types';
import { SettingsSectionCard, SettingsStatusBadge } from '../../../../ui/configuration/ConfigurationPrimitives';

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
  saveCodexApiKey,
  codexApiKeyNeedsSave,
  isSavingCodexApiKey,
  codexApiKeySaveFeedback,
}: SettingsProviderConnectionProps & {
  activeProvider: RepositoryProviderDefinition | null;
  summary: DashboardSummary;
  selectedProjectName: string | null;
  selectedRepositoryName: string | null;
  codexConfig: CodexIntegrationConfig;
  isCodexReady: boolean;
  updateCodexConfig: <K extends keyof CodexIntegrationConfig>(name: K, value: CodexIntegrationConfig[K]) => void;
  saveCodexApiKey: () => void | Promise<void>;
  codexApiKeyNeedsSave: boolean;
  isSavingCodexApiKey: boolean;
  codexApiKeySaveFeedback: {
    tone: 'success' | 'error';
    message: string;
  } | null;
}) {
  const [isProviderModalOpen, setIsProviderModalOpen] = React.useState(false);
  const [isCodexModalOpen, setIsCodexModalOpen] = React.useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = React.useState(false);

  const activeProviderLabel = config.provider ? activeProviderName : 'No seleccionado';
  const providerConnectionProps: SettingsProviderConnectionProps = {
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
  };

  return (
    <section className="space-y-6">
      <SettingsSectionCard
        eyebrow="Configuracion"
        title="Integraciones y reglas"
        description="La vista principal muestra solo el estado actual. Abre cada modal cuando necesites editar providers, integracion AI o politicas globales."
        badge={<SettingsStatusBadge tone="sky" label="Experiencia simplificada" />}
      >
        <SettingsIntegrationActionCards
          activeProviderLabel={activeProviderLabel}
          selectedProjectName={selectedProjectName}
          selectedRepositoryName={selectedRepositoryName}
          summary={summary}
          isConnectionReady={isConnectionReady}
          codexConfig={codexConfig}
          isCodexReady={isCodexReady}
          onOpenProvider={() => setIsProviderModalOpen(true)}
          onOpenCodex={() => setIsCodexModalOpen(true)}
          onOpenSnapshot={() => setIsSnapshotModalOpen(true)}
        />
      </SettingsSectionCard>

      <SettingsProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        activeProvider={activeProvider}
        connection={providerConnectionProps}
      />

      <SettingsSectionModal
        isOpen={isCodexModalOpen}
        onClose={() => setIsCodexModalOpen(false)}
        title="Configuracion de Codex"
        description="Toda la configuracion de analisis AI vive aqui para mantener Settings simple y enfocada."
      >
        <CodexIntegrationCard
          config={codexConfig}
          isReady={isCodexReady}
          onChange={updateCodexConfig}
          onSaveApiKey={saveCodexApiKey}
          apiKeyNeedsSave={codexApiKeyNeedsSave}
          isSavingApiKey={isSavingCodexApiKey}
          apiKeySaveFeedback={codexApiKeySaveFeedback}
        />
      </SettingsSectionModal>

      <SettingsSectionModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Reglas globales de snapshot"
        description="Ajusta exclusiones base y modo estricto sin mezclar este detalle con la vista principal."
      >
        <GlobalSnapshotPolicyCard
          snapshotPolicy={codexConfig.snapshotPolicy}
          onChange={(value) => updateCodexConfig('snapshotPolicy', value)}
        />
      </SettingsSectionModal>
    </section>
  );
}
