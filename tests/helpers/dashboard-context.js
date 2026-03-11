function createDashboardSummary(overrides = {}) {
  return {
    metrics: [],
    prioritizedPullRequests: [],
    repositoryInsights: [],
    branchInsights: [],
    reviewerInsights: [],
    deliveryIndicators: [],
    reviewIndicators: [],
    governanceAlerts: [],
    lastUpdatedLabel: 'Actualizado ahora',
    scopeLabel: 'Sin scope',
    noDescriptionCount: 0,
    activePRs: 0,
    highRiskPRs: 0,
    blockedPRs: 0,
    reviewBacklog: 0,
    averageAgeHours: 0,
    stalePRs: 0,
    repositoryCount: 0,
    hotfixPRs: 0,
    ...overrides,
  };
}

function createRepositorySourceContext(overrides = {}) {
  return {
    activeProvider: null,
    activeProviderName: 'No seleccionado',
    config: {
      provider: '',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    },
    error: null,
    isLoading: false,
    projects: [],
    projectsLoading: false,
    projectDiscoveryWarning: null,
    repositories: [],
    repositoriesLoading: false,
    hasCredentialsInSession: false,
    hasSuccessfulConnection: false,
    isConnectionReady: false,
    diagnostics: {
      operation: null,
      provider: '',
      organization: '',
      project: '',
      repositoryId: '',
      requestPath: '',
      lastError: null,
    },
    selectedProjectName: null,
    selectedRepositoryName: null,
    summary: createDashboardSummary(),
    isConnectionPanelOpen: false,
    updateConfig: jest.fn(),
    discoverProjects: jest.fn(),
    selectProject: jest.fn(),
    refreshPullRequests: jest.fn(),
    openPullRequest: jest.fn(),
    openConnectionPanel: jest.fn(),
    ...overrides,
  };
}

module.exports = {
  createDashboardSummary,
  createRepositorySourceContext,
};
