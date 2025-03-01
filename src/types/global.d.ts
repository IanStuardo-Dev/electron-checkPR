declare global {
  interface Window {
    electron: {
      sendNotification: (title: string, body: string) => void;
      runTests: () => Promise<void>;
      runSecurityScan: () => Promise<void>;
    }
  }
}

export {};