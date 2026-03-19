import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import { GitLabRepositoryService } from './repository.service';

export const gitlabProviderModule: RepositoryProviderModule = {
  kind: 'gitlab',
  createPort() {
    return Object.assign(new GitLabRepositoryService(), {
      kind: 'gitlab' as const,
    });
  },
};
