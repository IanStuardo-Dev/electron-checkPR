import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import { GitHubRepositoryService } from './repository.service';

export const githubProviderModule: RepositoryProviderModule = {
  kind: 'github',
  createPort() {
    return Object.assign(new GitHubRepositoryService(), {
      kind: 'github' as const,
    });
  },
};
