import type { SavedConnectionConfig } from './types';
import { loadStoredObject, removeStoredKeys, saveStoredObject } from '../../shared/storage/jsonStorage';
import { getSessionSecret, setSessionSecret } from '../../shared/storage/sessionSecrets';

export const DASHBOARD_STORAGE_KEY = 'checkpr.azure.config';
export const DASHBOARD_SESSION_CONFIG_KEY = 'checkpr.repository.session.config';
export const DASHBOARD_SESSION_PAT_KEY = 'checkpr.azure.session.pat';
export const DASHBOARD_SAVED_CONTEXTS_KEY = 'checkpr.azure.saved-contexts';

export const defaultConnectionConfig: SavedConnectionConfig = {
  provider: '',
  organization: '',
  project: '',
  repositoryId: '',
  personalAccessToken: '',
  targetReviewer: '',
};

export function loadConnectionConfig(): SavedConnectionConfig {
  removeStoredKeys(window.localStorage, [DASHBOARD_STORAGE_KEY, DASHBOARD_SAVED_CONTEXTS_KEY]);

  return {
    ...loadStoredObject<SavedConnectionConfig>(window.sessionStorage, DASHBOARD_SESSION_CONFIG_KEY, defaultConnectionConfig),
    personalAccessToken: '',
  };
}

export async function hydrateConnectionSecret(): Promise<string> {
  return getSessionSecret(DASHBOARD_SESSION_PAT_KEY);
}

export async function persistConnectionConfig(config: SavedConnectionConfig): Promise<void> {
  const safeConfig: SavedConnectionConfig = {
    ...config,
    personalAccessToken: '',
  };
  saveStoredObject(window.sessionStorage, DASHBOARD_SESSION_CONFIG_KEY, safeConfig);
  await setSessionSecret(DASHBOARD_SESSION_PAT_KEY, config.personalAccessToken);
  removeStoredKeys(window.localStorage, [DASHBOARD_STORAGE_KEY]);
}

export function loadSavedAzureContexts(): never[] {
  removeStoredKeys(window.localStorage, [DASHBOARD_SAVED_CONTEXTS_KEY]);
  return [];
}

export function persistSavedAzureContext(config: SavedConnectionConfig): void {
  void config;
  removeStoredKeys(window.localStorage, [DASHBOARD_SAVED_CONTEXTS_KEY]);
}
