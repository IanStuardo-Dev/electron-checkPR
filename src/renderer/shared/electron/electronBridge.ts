type ElectronApi = NonNullable<Window['electronApi']>;

const ELECTRON_BRIDGE_UNAVAILABLE_MESSAGE = 'Electron bridge is not available in this environment.';

function isElectronApi(value: unknown): value is ElectronApi {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ElectronApi>;
  return typeof candidate.invoke === 'function';
}

export function getElectronApi(): ElectronApi | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return isElectronApi(window.electronApi) ? window.electronApi : null;
}

export function hasElectronApi(): boolean {
  return getElectronApi() !== null;
}

export async function invokeElectronApi<T>(channel: string, payload?: unknown): Promise<T> {
  const electronApi = getElectronApi();

  if (!electronApi) {
    throw new Error(ELECTRON_BRIDGE_UNAVAILABLE_MESSAGE);
  }

  return electronApi.invoke(channel, payload) as Promise<T>;
}

export function subscribeToWindowStateChange(listener: (state: WindowControlsState) => void): () => void {
  const electronApi = getElectronApi();

  if (!electronApi || typeof electronApi.onWindowStateChange !== 'function') {
    return () => undefined;
  }

  return electronApi.onWindowStateChange(listener);
}

export function getElectronBridgeUnavailableMessage(): string {
  return ELECTRON_BRIDGE_UNAVAILABLE_MESSAGE;
}
