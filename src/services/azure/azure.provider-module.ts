import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import {
  composeRepositoryProviderPort,
  createPullRequestSnapshotCapabilityAdapter,
  createRepositorySnapshotCapabilityAdapter,
  createRepositorySourceCapabilityAdapter,
} from '../providers/repository-provider.capability-composition';
import { PullRequestService } from './pr.service';

export const azureProviderModule: RepositoryProviderModule = {
  kind: 'azure-devops',
  createPort() {
    const providerService = new PullRequestService();

    return composeRepositoryProviderPort('azure-devops', {
      source: createRepositorySourceCapabilityAdapter(providerService),
      pullRequestSnapshots: createPullRequestSnapshotCapabilityAdapter(providerService),
      repositorySnapshots: createRepositorySnapshotCapabilityAdapter(providerService),
    });
  },
};
