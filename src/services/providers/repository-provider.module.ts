import type { RepositoryProviderKind } from '../../types/repository';
import type { RepositoryProviderPort } from './repository-provider.port';

export interface RepositoryProviderModule {
  readonly kind: RepositoryProviderKind;
  createPort(): RepositoryProviderPort;
}
