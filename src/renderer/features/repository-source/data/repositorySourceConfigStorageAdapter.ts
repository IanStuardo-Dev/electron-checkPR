import type { RepositorySourceConfigStoragePort } from '../application/repositorySourceConfigStoragePort';
import {
  hydrateConnectionSecret,
  loadConnectionConfig,
  migrateLegacyRepositorySourceStorage,
  persistConnectionConfig,
} from './repositorySourceStorage';

export const repositorySourceConfigStorageAdapter: RepositorySourceConfigStoragePort = {
  loadConfig: loadConnectionConfig,
  persistConfig: persistConnectionConfig,
  hydrateSecret: hydrateConnectionSecret,
  migrateLegacyStorage: migrateLegacyRepositorySourceStorage,
};
