import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import { gitLabRepositoryService } from './repository.service';

export const gitlabProviderModule: RepositoryProviderModule = {
  kind: 'gitlab',
  createPort() {
    return Object.assign(gitLabRepositoryService, {
      kind: 'gitlab' as const,
    });
  },
};
