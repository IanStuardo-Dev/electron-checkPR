import type { SavedConnectionConfig } from '../types';
import { loadStoredObject, removeStoredKeys, saveStoredObject } from '../../../shared/storage/jsonStorage';
import { getSessionSecret, setSessionSecret } from '../../../shared/storage/sessionSecrets';

export const REPOSITORY_SOURCE_STORAGE_KEY = 'checkpr.azure.config';
export const REPOSITORY_SOURCE_SESSION_CONFIG_KEY = 'checkpr.repository.session.config';
export const REPOSITORY_SOURCE_SESSION_PAT_KEY = 'checkpr.azure.session.pat';
export const REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY = 'checkpr.azure.saved-contexts';

export const defaultConnectionConfig: SavedConnectionConfig = {
  provider: '',
  organization: '',
  project: '',
  repositoryId: '',
  personalAccessToken: '',
  targetReviewer: '',
};

export function loadConnectionConfig(): SavedConnectionConfig {
  removeStoredKeys(window.localStorage, [REPOSITORY_SOURCE_STORAGE_KEY, REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY]);

  return {
    ...loadStoredObject<SavedConnectionConfig>(window.sessionStorage, REPOSITORY_SOURCE_SESSION_CONFIG_KEY, defaultConnectionConfig),
    personalAccessToken: '',
  };
}

export async function hydrateConnectionSecret(): Promise<string> {
  return getSessionSecret(REPOSITORY_SOURCE_SESSION_PAT_KEY);
}

export async function persistConnectionConfig(config: SavedConnectionConfig): Promise<void> {
  const safeConfig: SavedConnectionConfig = {
    ...config,
    personalAccessToken: '',
  };
  saveStoredObject(window.sessionStorage, REPOSITORY_SOURCE_SESSION_CONFIG_KEY, safeConfig);
  await setSessionSecret(REPOSITORY_SOURCE_SESSION_PAT_KEY, config.personalAccessToken);
  removeStoredKeys(window.localStorage, [REPOSITORY_SOURCE_STORAGE_KEY]);
}

export function loadSavedAzureContexts(): never[] {
  removeStoredKeys(window.localStorage, [REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY]);
  return [];
}

export function persistSavedAzureContext(config: SavedConnectionConfig): void {
  void config;
  removeStoredKeys(window.localStorage, [REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY]);
}
