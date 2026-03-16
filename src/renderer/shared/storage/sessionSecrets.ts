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

export async function getSessionSecret(key: string): Promise<string> {
  if (!getElectronApi()) {
    throw new Error('No se detecto el bridge de Electron. Esta app requiere ejecutarse dentro de Electron.');
  }

  const response = await invokeElectronApi<SessionSecretResponse>('session-secrets:get', key);
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible leer el secreto de sesion.');
  }

  return response.data || '';
}

export async function setSessionSecret(key: string, value: string): Promise<void> {
  if (!getElectronApi()) {
    throw new Error('No se detecto el bridge de Electron. Esta app requiere ejecutarse dentro de Electron.');
  }

  const response = await invokeElectronApi<SessionSecretWriteResponse>('session-secrets:set', { key, value });
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible persistir el secreto de sesion.');
  }
}
