import { getElectronApi, invokeElectronApi } from '../electron/electronBridge';

interface SessionSecretResponse {
  ok: boolean;
  data?: string;
  error?: string;
}

interface SessionSecretWriteResponse {
  ok: boolean;
  error?: string;
}

const FALLBACK_SESSION_SECRET_PREFIX = 'checkpr.session-secret.';

function getFallbackStorageKey(key: string): string {
  return `${FALLBACK_SESSION_SECRET_PREFIX}${key}`;
}

export async function getSessionSecret(key: string): Promise<string> {
  if (!getElectronApi()) {
    return window.sessionStorage.getItem(getFallbackStorageKey(key)) || '';
  }

  const response = await invokeElectronApi<SessionSecretResponse>('session-secrets:get', key);
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible leer el secreto de sesion.');
  }

  return response.data || '';
}

export async function setSessionSecret(key: string, value: string): Promise<void> {
  if (!getElectronApi()) {
    const storageKey = getFallbackStorageKey(key);

    if (value) {
      window.sessionStorage.setItem(storageKey, value);
    } else {
      window.sessionStorage.removeItem(storageKey);
    }

    return;
  }

  const response = await invokeElectronApi<SessionSecretWriteResponse>('session-secrets:set', { key, value });
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible persistir el secreto de sesion.');
  }
}
