import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import { PullRequestService } from './pr.service';

export const azureProviderModule: RepositoryProviderModule = {
  kind: 'azure-devops',
  createPort() {
    return Object.assign(new PullRequestService(), {
      kind: 'azure-devops' as const,
    });
  },
};
