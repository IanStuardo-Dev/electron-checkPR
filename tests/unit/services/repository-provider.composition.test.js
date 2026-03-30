const {
  createPullRequestSnapshotProviderRegistry,
  createRepositoryProviderCapabilityRegistries,
  createRepositoryProviderCapabilityRegistriesFromModules,
  createRepositoryProviderRegistry,
  createRepositoryProviderRegistryFromModules,
  createRepositorySnapshotProviderRegistry,
  createRepositorySourceProviderRegistry,
} = require('../../../src/services/providers/repository-provider.composition');
const {
  buildDefaultRepositoryProviderPorts,
  buildDefaultRepositoryProviderModules,
} = require('../../../src/services/providers/repository-provider.bootstrap');

describe('repository provider composition', () => {
  test('crea un registry poblado con providers por defecto', () => {
    const registry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
    expect(registry.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });

  test('crea un registry poblado desde modules enchufables', () => {
    const registry = createRepositoryProviderRegistryFromModules(buildDefaultRepositoryProviderModules());
    expect(registry.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });

  test('los providers por defecto exponen capacidades segregadas requeridas', () => {
    const registry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
    const providers = registry.list();

    providers.forEach((provider) => {
      expect(typeof provider.getProjects).toBe('function');
      expect(typeof provider.getRepositories).toBe('function');
      expect(typeof provider.getBranches).toBe('function');
      expect(typeof provider.getPullRequests).toBe('function');
      expect(typeof provider.getPullRequestSnapshot).toBe('function');
      expect(typeof provider.getRepositorySnapshot).toBe('function');
    });
  });

  test('crea registries por capacidad desde providers ya construidos', () => {
    const providers = buildDefaultRepositoryProviderPorts();
    const registries = createRepositoryProviderCapabilityRegistries(providers);

    expect(registries.source.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
    expect(registries.repositorySnapshots.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
    expect(registries.pullRequestSnapshots.list().map((provider) => provider.kind)).toEqual(['azure-devops', 'github', 'gitlab']);
  });

  test('crea registries por capacidad desde modules', () => {
    const registries = createRepositoryProviderCapabilityRegistriesFromModules(buildDefaultRepositoryProviderModules());

    expect(registries.source.get('github').kind).toBe('github');
    expect(registries.repositorySnapshots.get('gitlab').kind).toBe('gitlab');
    expect(registries.pullRequestSnapshots.get('azure-devops').kind).toBe('azure-devops');
  });

  test('los registries por capacidad comparten el mismo contrato get/list', () => {
    const providers = buildDefaultRepositoryProviderPorts();

    const sourceRegistry = createRepositorySourceProviderRegistry(providers);
    const repositorySnapshotRegistry = createRepositorySnapshotProviderRegistry(providers);
    const pullRequestSnapshotRegistry = createPullRequestSnapshotProviderRegistry(providers);

    expect(sourceRegistry.get('github').kind).toBe('github');
    expect(repositorySnapshotRegistry.get('github').kind).toBe('github');
    expect(pullRequestSnapshotRegistry.get('github').kind).toBe('github');
  });
});
