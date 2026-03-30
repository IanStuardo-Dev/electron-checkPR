import type { RepositoryProviderKind } from '../../types/repository';
import type {
  PullRequestSnapshotProviderPort,
  RepositoryProviderPort,
  RepositorySnapshotProviderPort,
  RepositorySourceProviderPort,
} from './repository-provider.port';
import type { RepositoryProviderModule } from './repository-provider.module';
import { RepositoryProviderRegistryBuilder } from './repository-provider.registry';

export function createRepositoryProviderRegistry(providers: RepositoryProviderPort[] = []) {
  const registryBuilder = new RepositoryProviderRegistryBuilder();
  registryBuilder.registerMany(providers);
  return registryBuilder.build();
}

export function createRepositoryProviderRegistryFromModules(modules: RepositoryProviderModule[] = []) {
  return createRepositoryProviderRegistry(modules.map((module) => module.createPort()));
}

interface CapabilityRegistry<TProvider> {
  get(kind: RepositoryProviderKind): TProvider;
  list(): TProvider[];
}

export type RepositorySourceProviderRegistry = CapabilityRegistry<RepositorySourceProviderPort>;
export type RepositorySnapshotProviderRegistry = CapabilityRegistry<RepositorySnapshotProviderPort>;
export type PullRequestSnapshotProviderRegistry = CapabilityRegistry<PullRequestSnapshotProviderPort>;

export interface RepositoryProviderCapabilityRegistries {
  source: RepositorySourceProviderRegistry;
  repositorySnapshots: RepositorySnapshotProviderRegistry;
  pullRequestSnapshots: PullRequestSnapshotProviderRegistry;
}

function createCapabilityRegistry<TProvider extends { kind: RepositoryProviderKind }>(
  providers: TProvider[] = [],
): CapabilityRegistry<TProvider> {
  const providersMap = new Map<RepositoryProviderKind, TProvider>(
    providers.map((provider) => [provider.kind, provider]),
  );

  return {
    get(kind) {
      const provider = providersMap.get(kind);
      if (!provider) {
        throw new Error(`El provider ${kind} aun no esta registrado.`);
      }

      return provider;
    },
    list() {
      return Array.from(providersMap.values());
    },
  };
}

export function createRepositorySourceProviderRegistry(
  providers: RepositorySourceProviderPort[] = [],
): RepositorySourceProviderRegistry {
  return createCapabilityRegistry(providers);
}

export function createRepositorySnapshotProviderRegistry(
  providers: RepositorySnapshotProviderPort[] = [],
): RepositorySnapshotProviderRegistry {
  return createCapabilityRegistry(providers);
}

export function createPullRequestSnapshotProviderRegistry(
  providers: PullRequestSnapshotProviderPort[] = [],
): PullRequestSnapshotProviderRegistry {
  return createCapabilityRegistry(providers);
}

export function createRepositoryProviderCapabilityRegistries(
  providers: RepositoryProviderPort[] = [],
): RepositoryProviderCapabilityRegistries {
  return {
    source: createRepositorySourceProviderRegistry(providers),
    repositorySnapshots: createRepositorySnapshotProviderRegistry(providers),
    pullRequestSnapshots: createPullRequestSnapshotProviderRegistry(providers),
  };
}

export function createRepositoryProviderCapabilityRegistriesFromModules(
  modules: RepositoryProviderModule[] = [],
): RepositoryProviderCapabilityRegistries {
  return createRepositoryProviderCapabilityRegistries(modules.map((module) => module.createPort()));
}
