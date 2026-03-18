import type { SavedConnectionConfig } from '../types';
import { getRepositorySourceProviderBehavior } from './repositorySourceProviderBehavior';

export function hasMinimumProjectDiscoveryConfig(config: SavedConnectionConfig): boolean {
  return Boolean(config.provider && config.organization.trim() && config.personalAccessToken.trim());
}

export function hasMinimumRepositoryConfig(config: SavedConnectionConfig): boolean {
  if (!config.provider) {
    return false;
  }

  return getRepositorySourceProviderBehavior(config.provider)?.hasMinimumRepositoryConfig(config) || false;
}

export function hasMinimumPullRequestSyncConfig(config: SavedConnectionConfig): boolean {
  return hasMinimumRepositoryConfig(config);
}
