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
  const response = await window.electronApi.invoke('session-secrets:get', key) as SessionSecretResponse;
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible leer el secreto de sesion.');
  }

  return response.data || '';
}

export async function setSessionSecret(key: string, value: string): Promise<void> {
  const response = await window.electronApi.invoke('session-secrets:set', { key, value }) as SessionSecretWriteResponse;
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible persistir el secreto de sesion.');
  }
}
