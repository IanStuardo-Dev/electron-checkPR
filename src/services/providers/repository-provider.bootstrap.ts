import { pullRequestService } from '../azure/pr.service';
import { gitHubRepositoryService } from '../github/repository.service';
import { gitLabRepositoryService } from '../gitlab/repository.service';
import type { RepositoryProviderKind } from '../../types/repository';
import type { RepositoryProviderPort, RepositoryProviderService } from './repository-provider.port';

function createProviderPort(
  kind: RepositoryProviderKind,
  service: RepositoryProviderService,
): RepositoryProviderPort {
  return Object.assign(service, {
    kind,
  });
}

export function buildDefaultRepositoryProviderPorts(): RepositoryProviderPort[] {
  return [
    createProviderPort('azure-devops', pullRequestService),
    createProviderPort('github', gitHubRepositoryService),
    createProviderPort('gitlab', gitLabRepositoryService),
  ];
}
