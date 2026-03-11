declare global {
  interface Window {
    electronApi: {
      invoke: (channel: string, payload?: unknown) => Promise<unknown>;
    };
  }
}

export {};
