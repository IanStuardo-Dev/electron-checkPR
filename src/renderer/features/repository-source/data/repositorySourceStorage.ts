import type { SavedConnectionConfig } from '../types';
import {
  LEGACY_REPOSITORY_SOURCE_SESSION_SECRET_KEY,
  REPOSITORY_SOURCE_SESSION_SECRET_KEY,
} from '../../../../constants/session-secrets';
import { loadStoredObject, removeStoredKeys, saveStoredObject } from '../../../shared/storage/jsonStorage';
import { getSessionSecret, setSessionSecret } from '../../../shared/storage/sessionSecrets';

export const REPOSITORY_SOURCE_SESSION_CONFIG_KEY = 'checkpr.repository.session.config';
export { REPOSITORY_SOURCE_SESSION_SECRET_KEY };

const LEGACY_REPOSITORY_SOURCE_LOCAL_CONFIG_KEY = 'checkpr.azure.config';
const LEGACY_REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY = 'checkpr.azure.saved-contexts';

export const defaultConnectionConfig: SavedConnectionConfig = {
  provider: '',
  organization: '',
  project: '',
  repositoryId: '',
  personalAccessToken: '',
  targetReviewer: '',
};

function clearLegacyRepositorySourceStorage(): void {
  removeStoredKeys(window.localStorage, [
    LEGACY_REPOSITORY_SOURCE_LOCAL_CONFIG_KEY,
    LEGACY_REPOSITORY_SOURCE_SAVED_CONTEXTS_KEY,
  ]);
}

export function loadConnectionConfig(): SavedConnectionConfig {
  return {
    ...loadStoredObject<SavedConnectionConfig>(window.sessionStorage, REPOSITORY_SOURCE_SESSION_CONFIG_KEY, defaultConnectionConfig),
    personalAccessToken: '',
  };
}

export async function migrateLegacyRepositorySourceStorage(): Promise<void> {
  clearLegacyRepositorySourceStorage();

  const storedSecret = await getSessionSecret(REPOSITORY_SOURCE_SESSION_SECRET_KEY);
  if (storedSecret) {
    await setSessionSecret(LEGACY_REPOSITORY_SOURCE_SESSION_SECRET_KEY, '');
    return;
  }

  const legacySecret = await getSessionSecret(LEGACY_REPOSITORY_SOURCE_SESSION_SECRET_KEY);
  if (!legacySecret) {
    return;
  }

  await setSessionSecret(REPOSITORY_SOURCE_SESSION_SECRET_KEY, legacySecret);
  await setSessionSecret(LEGACY_REPOSITORY_SOURCE_SESSION_SECRET_KEY, '');
}

export async function hydrateConnectionSecret(): Promise<string> {
  const storedSecret = await getSessionSecret(REPOSITORY_SOURCE_SESSION_SECRET_KEY);
  return storedSecret || '';
}

export async function persistConnectionConfig(config: SavedConnectionConfig): Promise<void> {
  const safeConfig: SavedConnectionConfig = {
    ...config,
    personalAccessToken: '',
  };
  saveStoredObject(window.sessionStorage, REPOSITORY_SOURCE_SESSION_CONFIG_KEY, safeConfig);
  await setSessionSecret(REPOSITORY_SOURCE_SESSION_SECRET_KEY, config.personalAccessToken);
}
