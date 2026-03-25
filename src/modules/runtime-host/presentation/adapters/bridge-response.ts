import { ipcMain } from 'electron';

export interface BridgeSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface BridgeErrorResponse {
  ok: false;
  error: string;
}

export interface BridgeCommandEvent {
  sender: Electron.WebContents;
}

export async function safeBridgeResponse<T>(task: () => Promise<T>): Promise<BridgeSuccessResponse<T> | BridgeErrorResponse> {
  try {
    return {
      ok: true,
      data: await task(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown transport error.',
    };
  }
}

export function registerBridgeCommand<TPayload = unknown, TResult = unknown>(
  command: string,
  handler: (payload: TPayload, event: BridgeCommandEvent) => Promise<TResult>,
): void {
  ipcMain.handle(command, async (event, payload) => (
    safeBridgeResponse(() => handler(payload as TPayload, event))
  ));
}


