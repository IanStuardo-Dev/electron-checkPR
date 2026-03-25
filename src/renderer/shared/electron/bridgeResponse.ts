import { invokeElectronApi } from './electronBridge';

interface BridgeSuccessResponse<T> {
  ok: true;
  data: T;
}

interface BridgeErrorResponse {
  ok: false;
  error: string;
}

export type BridgeResponse<T> = BridgeSuccessResponse<T> | BridgeErrorResponse;

export async function invokeBridgeResponse<T>(command: string, payload?: unknown): Promise<T> {
  const response = await invokeElectronApi<BridgeResponse<T>>(command, payload);

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

