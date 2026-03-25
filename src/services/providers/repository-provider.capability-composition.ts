import type { RepositoryProviderKind } from '../../types/repository';
import type {
  PullRequestSnapshotProviderPort,
  RepositoryProviderPort,
  RepositoryProviderService,
  RepositorySnapshotProviderPort,
  RepositorySourceProviderPort,
} from './repository-provider.port';

export type RepositorySourceCapabilityAdapter = Omit<RepositorySourceProviderPort, 'kind'>;
export type PullRequestSnapshotCapabilityAdapter = Omit<PullRequestSnapshotProviderPort, 'kind'>;
export type RepositorySnapshotCapabilityAdapter = Omit<RepositorySnapshotProviderPort, 'kind'>;

export function createRepositorySourceCapabilityAdapter(
  providerService: RepositoryProviderService,
): RepositorySourceCapabilityAdapter {
  return {
    getProjects: (config) => providerService.getProjects(config),
    getRepositories: (config) => providerService.getRepositories(config),
    getBranches: (config) => providerService.getBranches(config),
    getPullRequests: (config) => providerService.getPullRequests(config),
  };
}

export function createPullRequestSnapshotCapabilityAdapter(
  providerService: RepositoryProviderService,
): PullRequestSnapshotCapabilityAdapter {
  return {
    getPullRequestSnapshot: (config, pullRequest, options) => (
      providerService.getPullRequestSnapshot(config, pullRequest, options)
    ),
  };
}

export function createRepositorySnapshotCapabilityAdapter(
  providerService: RepositoryProviderService,
): RepositorySnapshotCapabilityAdapter {
  return {
    getRepositorySnapshot: (config, options) => providerService.getRepositorySnapshot(config, options),
  };
}

export function composeRepositoryProviderPort(
  kind: RepositoryProviderKind,
  capabilities: {
    source: RepositorySourceCapabilityAdapter;
    pullRequestSnapshots: PullRequestSnapshotCapabilityAdapter;
    repositorySnapshots: RepositorySnapshotCapabilityAdapter;
  },
): RepositoryProviderPort {
  return {
    kind,
    ...capabilities.source,
    ...capabilities.pullRequestSnapshots,
    ...capabilities.repositorySnapshots,
  };
}
