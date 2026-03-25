import type { RepositoryProviderModule } from '../providers/repository-provider.module';
import {
  composeRepositoryProviderPort,
  createPullRequestSnapshotCapabilityAdapter,
  createRepositorySnapshotCapabilityAdapter,
  createRepositorySourceCapabilityAdapter,
} from '../providers/repository-provider.capability-composition';
import { GitHubRepositoryService } from './repository.service';

export const githubProviderModule: RepositoryProviderModule = {
  kind: 'github',
  createPort() {
    const providerService = new GitHubRepositoryService();

    return composeRepositoryProviderPort('github', {
      source: createRepositorySourceCapabilityAdapter(providerService),
      pullRequestSnapshots: createPullRequestSnapshotCapabilityAdapter(providerService),
      repositorySnapshots: createRepositorySnapshotCapabilityAdapter(providerService),
    });
  },
};
