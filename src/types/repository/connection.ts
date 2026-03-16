import type { RepositoryProviderKind } from './providers';

export interface RepositoryConnectionConfig {
  provider: RepositoryProviderKind;
  organization: string;
  project: string;
  repositoryId?: string;
  personalAccessToken: string;
  targetReviewer?: string;
}
