import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import { pullRequestService } from './pr.service';

export const azureProviderModule: RepositoryProviderModule = {
  kind: 'azure-devops',
  createPort() {
    return Object.assign(pullRequestService, {
      kind: 'azure-devops' as const,
    });
  },
};
