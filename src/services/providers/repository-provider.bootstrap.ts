import { azureProviderModule } from '../azure/azure.provider-module';
import { githubProviderModule } from '../github/github.provider-module';
import { gitlabProviderModule } from '../gitlab/gitlab.provider-module';
import type { RepositoryProviderPort } from './repository-provider.port';
import type { RepositoryProviderModule } from './repository-provider.module';

export function buildDefaultRepositoryProviderModules(): RepositoryProviderModule[] {
  return [
    azureProviderModule,
    githubProviderModule,
    gitlabProviderModule,
  ];
}

export function buildDefaultRepositoryProviderPorts(): RepositoryProviderPort[] {
  return buildDefaultRepositoryProviderModules().map((module) => module.createPort());
}
