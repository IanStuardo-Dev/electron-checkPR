export function loadStoredObject<T extends object>(
  storage: Storage,
  key: string,
  fallback: T,
): T {
  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return { ...fallback };
    }

    return {
      ...fallback,
      ...(JSON.parse(rawValue) as Partial<T>),
    };
  } catch {
    return { ...fallback };
  }
}

export function saveStoredObject(storage: Storage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value));
}

export function removeStoredKeys(storage: Storage, keys: string[]): void {
  keys.forEach((key) => storage.removeItem(key));
}
