import React from 'react';
import { motion } from 'framer-motion';
import { useRepositorySourceContext } from '../features/dashboard/context/RepositorySourceContext';
import { useCodexSettings } from '../features/settings/hooks/useCodexSettings';
import {
  SettingsDiagnosticsSection,
  SettingsHero,
  SettingsIntegrationsSection,
  SettingsOperationalSection,
  SettingsRoadmapSection,
} from '../features/settings/components/SettingsSections';

const Settings = () => {
  const {
    activeProvider,
    activeProviderName,
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
  } = useRepositorySourceContext();
  const {
    config: codexConfig,
    isReady: isCodexReady,
    updateConfig: updateCodexConfig,
  } = useCodexSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <SettingsHero
        isConnectionReady={isConnectionReady}
        isCodexReady={isCodexReady}
      />

      <SettingsOperationalSection
        activeProvider={activeProvider}
        activeProviderName={activeProviderName}
        config={config}
        selectedProjectName={selectedProjectName}
        selectedRepositoryName={selectedRepositoryName}
        summary={summary}
        isConnectionReady={isConnectionReady}
        isCodexReady={isCodexReady}
      />

      <SettingsIntegrationsSection
        activeProvider={activeProvider}
        activeProviderName={activeProviderName}
        config={config}
        summary={summary}
        selectedProjectName={selectedProjectName}
        selectedRepositoryName={selectedRepositoryName}
        error={error}
        isConnectionReady={isConnectionReady}
        isLoading={isLoading}
        projects={projects}
        projectsLoading={projectsLoading}
        projectDiscoveryWarning={projectDiscoveryWarning}
        repositories={repositories}
        repositoriesLoading={repositoriesLoading}
        discoverProjects={() => void discoverProjects()}
        selectProject={(project) => void selectProject(project)}
        updateConfig={updateConfig}
        refreshPullRequests={() => void refreshPullRequests()}
        codexConfig={codexConfig}
        isCodexReady={isCodexReady}
        updateCodexConfig={updateCodexConfig}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div />
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <SettingsDiagnosticsSection
            activeProviderName={activeProviderName}
            config={config}
            diagnostics={diagnostics}
            hasCredentialsInSession={hasCredentialsInSession}
            hasSuccessfulConnection={hasSuccessfulConnection}
          />
          <SettingsRoadmapSection />
        </div>
      </section>
    </motion.div>
  );
};

export default Settings;
