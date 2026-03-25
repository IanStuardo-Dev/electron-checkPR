import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import {
  composeRepositoryProviderPort,
  createPullRequestSnapshotCapabilityAdapter,
  createRepositorySnapshotCapabilityAdapter,
  createRepositorySourceCapabilityAdapter,
} from '../providers/repository-provider.capability-composition';
import { GitLabRepositoryService } from './repository.service';

export const gitlabProviderModule: RepositoryProviderModule = {
  kind: 'gitlab',
  createPort() {
    const providerService = new GitLabRepositoryService();

    return composeRepositoryProviderPort('gitlab', {
      source: createRepositorySourceCapabilityAdapter(providerService),
      pullRequestSnapshots: createPullRequestSnapshotCapabilityAdapter(providerService),
      repositorySnapshots: createRepositorySnapshotCapabilityAdapter(providerService),
    });
  },
};
