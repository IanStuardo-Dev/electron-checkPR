import type { SavedConnectionConfig } from './types';

export const DASHBOARD_STORAGE_KEY = 'checkpr.azure.config';
export const DASHBOARD_SESSION_CONFIG_KEY = 'checkpr.repository.session.config';
export const DASHBOARD_SESSION_PAT_KEY = 'checkpr.azure.session.pat';
export const DASHBOARD_SAVED_CONTEXTS_KEY = 'checkpr.azure.saved-contexts';

export const defaultConnectionConfig: SavedConnectionConfig = {
  provider: 'azure-devops',
  organization: '',
  project: '',
  repositoryId: '',
  personalAccessToken: '',
  targetReviewer: '',
};

export function loadConnectionConfig(): SavedConnectionConfig {
  try {
    const sessionPat = window.sessionStorage.getItem(DASHBOARD_SESSION_PAT_KEY) || '';
    const savedSessionConfig = window.sessionStorage.getItem(DASHBOARD_SESSION_CONFIG_KEY);
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    window.localStorage.removeItem(DASHBOARD_SAVED_CONTEXTS_KEY);

    return {
      ...defaultConnectionConfig,
      ...(savedSessionConfig ? (JSON.parse(savedSessionConfig) as Partial<SavedConnectionConfig>) : {}),
      personalAccessToken: sessionPat,
    };
  } catch {
    return defaultConnectionConfig;
  }
}

export function persistConnectionConfig(config: SavedConnectionConfig): void {
  if (config.personalAccessToken) {
    window.sessionStorage.setItem(DASHBOARD_SESSION_PAT_KEY, config.personalAccessToken);
  } else {
    window.sessionStorage.removeItem(DASHBOARD_SESSION_PAT_KEY);
  }
  const safeConfig: SavedConnectionConfig = {
    ...config,
    personalAccessToken: '',
  };
  window.sessionStorage.setItem(DASHBOARD_SESSION_CONFIG_KEY, JSON.stringify(safeConfig));
  window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
}

export function loadSavedAzureContexts(): never[] {
  window.localStorage.removeItem(DASHBOARD_SAVED_CONTEXTS_KEY);
  return [];
}

export function persistSavedAzureContext(config: SavedConnectionConfig): void {
  void config;
  window.localStorage.removeItem(DASHBOARD_SAVED_CONTEXTS_KEY);
}
