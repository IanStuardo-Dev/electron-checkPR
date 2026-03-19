import React from 'react';
import { useRepositorySourceContext } from '../../features/repository-source/context';
import {
  SettingsDiagnosticsSection,
  SettingsHero,
  SettingsIntegrationsSection,
  SettingsOperationalSection,
  useCodexSettings,
} from '../../features/settings';

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
    <div className="mx-auto max-w-[1220px] space-y-6 lg:space-y-8">
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
    </div>
  );
};

export default Settings;
