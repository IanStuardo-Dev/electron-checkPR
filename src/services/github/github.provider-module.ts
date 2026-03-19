import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import { gitHubRepositoryService } from './repository.service';

export const githubProviderModule: RepositoryProviderModule = {
  kind: 'github',
  createPort() {
    return Object.assign(gitHubRepositoryService, {
      kind: 'github' as const,
    });
  },
};
