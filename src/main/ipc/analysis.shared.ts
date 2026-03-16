import type { RepositoryProviderKind } from '../../types/repository';

export function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return value.trim();
}

export function normalizeProvider(value: unknown, fieldName: string): RepositoryProviderKind {
  if (value !== 'azure-devops' && value !== 'github' && value !== 'gitlab') {
    throw new Error(`${fieldName} no es valido.`);
  }

  return value;
}

export function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined;
}

export function clampNumber(value: unknown, minimum: number, maximum: number, fallback: number): number {
  return Math.min(maximum, Math.max(minimum, Math.floor(Number(value) || fallback)));
}

export function readSnapshotPolicy(payload: unknown): { excludedPathPatterns: string; strictMode: boolean } {
  const policy = payload && typeof payload === 'object'
    ? payload as { excludedPathPatterns?: unknown; strictMode?: unknown }
    : {};

  return {
    excludedPathPatterns: typeof policy.excludedPathPatterns === 'string'
      ? policy.excludedPathPatterns.slice(0, 4000)
      : '',
    strictMode: Boolean(policy.strictMode),
  };
}
