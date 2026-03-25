import type { RepositoryProviderKind } from '../../../../../types/repository';
import type { RepositoryAnalysisSnapshotPolicy } from '../../../../../types/analysis/snapshot';
import {
  isRepositoryProviderKind,
  supportsRepositoryProviderCapability,
  type RepositoryProviderCapability,
} from '../../../../../services/providers/repository-provider.capabilities';

export function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} es obligatorio.`);
  }

  return value.trim();
}

export function normalizeProvider(
  value: unknown,
  fieldName: string,
  capability: RepositoryProviderCapability = 'supportsRepositoryAnalysis',
): RepositoryProviderKind {
  if (!isRepositoryProviderKind(value) || !supportsRepositoryProviderCapability(value, capability)) {
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

export function readSnapshotPolicy(payload: unknown): RepositoryAnalysisSnapshotPolicy {
  const policy = payload && typeof payload === 'object'
    ? payload as Partial<Record<keyof RepositoryAnalysisSnapshotPolicy, unknown>>
    : {};

  return {
    excludedPathPatterns: typeof policy.excludedPathPatterns === 'string'
      ? policy.excludedPathPatterns.slice(0, 4000)
      : '',
    strictMode: Boolean(policy.strictMode),
  };
}

