import { invokeBridgeResponse } from '../electron/bridgeResponse';

export async function getSessionSecret(key: string): Promise<string> {
  return invokeBridgeResponse<string>('session-secrets:get', key);
}

export async function hasCodexSessionApiKey(): Promise<boolean> {
  return invokeBridgeResponse<boolean>('session-secrets:codex-has');
}

export async function setSessionSecret(key: string, value: string): Promise<void> {
  await invokeBridgeResponse<void>('session-secrets:set', { key, value });
}
