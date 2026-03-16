declare global {
  interface WindowControlsState {
    isMaximized: boolean;
    isFullScreen: boolean;
    platform: NodeJS.Platform;
  }

  interface Window {
    electronApi: {
      invoke: (channel: string, payload?: unknown) => Promise<unknown>;
      onWindowStateChange: (listener: (payload: WindowControlsState) => void) => () => void;
    };
  }
}

export {};
