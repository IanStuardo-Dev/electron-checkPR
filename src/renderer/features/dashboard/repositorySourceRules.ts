import type { SavedConnectionConfig } from './types';

export function hasMinimumProjectDiscoveryConfig(config: SavedConnectionConfig): boolean {
  return Boolean(config.provider && config.organization.trim() && config.personalAccessToken.trim());
}

export function hasMinimumRepositoryConfig(config: SavedConnectionConfig): boolean {
  if (!config.provider) {
    return false;
  }

  if (config.provider === 'github' || config.provider === 'gitlab') {
    return Boolean(config.organization && config.personalAccessToken);
  }

  return Boolean(config.organization && config.project && config.personalAccessToken);
}

