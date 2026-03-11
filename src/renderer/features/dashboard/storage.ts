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

async function getSessionSecret(key: string): Promise<string> {
  const response = await window.electronApi.invoke('session-secrets:get', key) as { ok: boolean; data?: string; error?: string };
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible leer el secreto de sesion.');
  }

  return response.data || '';
}

async function setSessionSecret(key: string, value: string): Promise<void> {
  const response = await window.electronApi.invoke('session-secrets:set', { key, value }) as { ok: boolean; error?: string };
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible persistir el secreto de sesion.');
  }
}

export function loadConnectionConfig(): SavedConnectionConfig {
  try {
    const savedSessionConfig = window.sessionStorage.getItem(DASHBOARD_SESSION_CONFIG_KEY);
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    window.localStorage.removeItem(DASHBOARD_SAVED_CONTEXTS_KEY);

    return {
      ...defaultConnectionConfig,
      ...(savedSessionConfig ? (JSON.parse(savedSessionConfig) as Partial<SavedConnectionConfig>) : {}),
      personalAccessToken: '',
    };
  } catch {
    return defaultConnectionConfig;
  }
}

export async function hydrateConnectionSecret(): Promise<string> {
  return getSessionSecret(DASHBOARD_SESSION_PAT_KEY);
}

export async function persistConnectionConfig(config: SavedConnectionConfig): Promise<void> {
  await setSessionSecret(DASHBOARD_SESSION_PAT_KEY, config.personalAccessToken);
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
