declare global {
  interface Window {
    global?: typeof globalThis;
  }
}

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

export {};
