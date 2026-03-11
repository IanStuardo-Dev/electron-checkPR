import { ipcMain } from 'electron';

export interface IpcSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface IpcErrorResponse {
  ok: false;
  error: string;
}

export async function safeIpcResponse<T>(task: () => Promise<T>): Promise<IpcSuccessResponse<T> | IpcErrorResponse> {
  try {
    return {
      ok: true,
      data: await task(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown IPC error.',
    };
  }
}

export function registerHandle<TPayload = unknown, TResult = unknown>(
  channel: string,
  handler: (payload: TPayload) => Promise<TResult>,
): void {
  ipcMain.handle(channel, async (_event, payload) => safeIpcResponse(() => handler(payload as TPayload)));
}
