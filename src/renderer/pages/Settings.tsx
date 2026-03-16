import React from 'react';
import { motion } from 'framer-motion';
import { useRepositorySourceContext } from '../features/dashboard/context/RepositorySourceContext';
import { useCodexSettings } from '../features/settings/hooks/useCodexSettings';
import {
  SettingsDiagnosticsSection,
  SettingsHero,
  SettingsIntegrationsSection,
  SettingsOperationalSection,
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
  const handleDiscoverProjects = () => void discoverProjects();
  const handleSelectProject = (project: string) => void selectProject(project);
  const handleRefreshPullRequests = () => void refreshPullRequests();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[1220px] space-y-6 lg:space-y-8"
    >
      <SettingsHero
        isConnectionReady={isConnectionReady}
        isCodexReady={isCodexReady}
      />

      <div className="space-y-6">
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
          discoverProjects={handleDiscoverProjects}
          selectProject={handleSelectProject}
          updateConfig={updateConfig}
          refreshPullRequests={handleRefreshPullRequests}
          codexConfig={codexConfig}
          isCodexReady={isCodexReady}
          updateCodexConfig={updateCodexConfig}
        />

        <SettingsDiagnosticsSection
          activeProviderName={activeProviderName}
          config={config}
          diagnostics={diagnostics}
          hasCredentialsInSession={hasCredentialsInSession}
          hasSuccessfulConnection={hasSuccessfulConnection}
        />
      </div>
    </motion.div>
  );
};

export default Settings;
