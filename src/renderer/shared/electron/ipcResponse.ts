import { invokeElectronApi } from './electronBridge';

interface IpcSuccessResponse<T> {
  ok: true;
  data: T;
}

interface IpcErrorResponse {
  ok: false;
  error: string;
}

export type IpcResponse<T> = IpcSuccessResponse<T> | IpcErrorResponse;

export async function invokeIpcResponse<T>(channel: string, payload?: unknown): Promise<T> {
  const response = await invokeElectronApi<IpcResponse<T>>(channel, payload);

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}
