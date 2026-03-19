import type { SavedConnectionConfig } from '../types';

export interface RepositorySourceConfigStoragePort {
  loadConfig(): SavedConnectionConfig;
  persistConfig(config: SavedConnectionConfig): Promise<void>;
  hydrateSecret(): Promise<string>;
  migrateLegacyStorage(): Promise<void>;
}
