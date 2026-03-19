import type { RepositoryProviderKind } from '../../types/repository';

export interface RepositoryProviderCapabilities {
  supportsRepositorySource: boolean;
  supportsRepositoryAnalysis: boolean;
  supportsPullRequestAnalysis: boolean;
}

const PROVIDER_CAPABILITIES: Record<RepositoryProviderKind, RepositoryProviderCapabilities> = {
  'azure-devops': {
    supportsRepositorySource: true,
    supportsRepositoryAnalysis: true,
    supportsPullRequestAnalysis: true,
  },
  github: {
    supportsRepositorySource: true,
    supportsRepositoryAnalysis: true,
    supportsPullRequestAnalysis: true,
  },
  gitlab: {
    supportsRepositorySource: true,
    supportsRepositoryAnalysis: true,
    supportsPullRequestAnalysis: true,
  },
  bitbucket: {
    supportsRepositorySource: false,
    supportsRepositoryAnalysis: false,
    supportsPullRequestAnalysis: false,
  },
};

export type RepositoryProviderCapability = keyof RepositoryProviderCapabilities;

export function isRepositoryProviderKind(value: unknown): value is RepositoryProviderKind {
  return typeof value === 'string' && value in PROVIDER_CAPABILITIES;
}

export function getRepositoryProviderCapabilities(kind: RepositoryProviderKind): RepositoryProviderCapabilities {
  return PROVIDER_CAPABILITIES[kind];
}

export function supportsRepositoryProviderCapability(
  kind: RepositoryProviderKind,
  capability: RepositoryProviderCapability,
): boolean {
  return getRepositoryProviderCapabilities(kind)[capability];
}
