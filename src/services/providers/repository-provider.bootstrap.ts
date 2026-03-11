import { pullRequestService } from '../azure/pr.service';
import { gitHubRepositoryService } from '../github/repository.service';
import { gitLabRepositoryService } from '../gitlab/repository.service';
import type { RepositoryProviderPort } from './repository-provider.port';
import { registerRepositoryProviderPorts } from './repository-provider.registry';
import type {
  RepositoryBranch,
  RepositoryConnectionConfig,
  RepositoryProject,
  RepositoryProviderKind,
  RepositorySnapshotOptions,
  RepositorySummary,
  ReviewItem,
} from '../../types/repository';
import type { RepositorySnapshot } from '../../types/analysis';

function createProviderPort(
  kind: RepositoryProviderKind,
  service: {
    getProjects(config: RepositoryConnectionConfig): Promise<RepositoryProject[]>;
    getRepositories(config: RepositoryConnectionConfig): Promise<RepositorySummary[]>;
    getBranches(config: RepositoryConnectionConfig): Promise<RepositoryBranch[]>;
    getPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]>;
    getRepositorySnapshot(config: RepositoryConnectionConfig, options: RepositorySnapshotOptions): Promise<RepositorySnapshot>;
  },
): RepositoryProviderPort {
  return {
    kind,
    getProjects: (config) => service.getProjects(config),
    getRepositories: (config) => service.getRepositories(config),
    getBranches: (config) => service.getBranches(config),
    getPullRequests: (config) => service.getPullRequests(config),
    getRepositorySnapshot: (config, options) => service.getRepositorySnapshot(config, options),
  };
}

let defaultProvidersRegistered = false;

export function registerDefaultRepositoryProviders(): void {
  if (defaultProvidersRegistered) {
    return;
  }

  registerRepositoryProviderPorts([
    createProviderPort('azure-devops', pullRequestService),
    createProviderPort('github', gitHubRepositoryService),
    createProviderPort('gitlab', gitLabRepositoryService),
  ]);

  defaultProvidersRegistered = true;
}
