import type { RepositoryProviderDefinition, RepositoryProviderSelection } from '../../../types/repository';

export const repositoryProviders: RepositoryProviderDefinition[] = [
  {
    kind: 'azure-devops',
    name: 'Azure DevOps',
    status: 'available',
    description: 'Primer provider operativo. Soporta proyectos, repositorios, ramas y Pull Requests activos.',
    helperText: 'Usa organization, project y PAT con permisos de lectura sobre Code.',
  },
  {
    kind: 'github',
    name: 'GitHub',
    status: 'available',
    description: 'Segundo provider operativo. Soporta owner, repositorios, ramas y Pull Requests abiertos.',
    helperText: 'Usa owner u organizacion y un personal access token clasico o fine-grained con permisos sobre Pull requests y Contents.',
  },
  {
    kind: 'gitlab',
    name: 'GitLab',
    status: 'available',
    description: 'Tercer provider operativo. Soporta namespace, proyectos, ramas y Merge Requests abiertos.',
    helperText: 'Usa group/namespace y un personal access token con scopes de lectura sobre API y repositorios.',
  },
  {
    kind: 'bitbucket',
    name: 'Bitbucket',
    status: 'todo',
    description: 'Backlog futuro para completar el set de suites de repositorios.',
    helperText: 'Pendiente de implementar soporte para workspaces, repositorios, ramas y Pull Requests.',
  },
];

export function getRepositoryProvider(kind: RepositoryProviderSelection): RepositoryProviderDefinition | null {
  if (!kind) {
    return null;
  }

  return repositoryProviders.find((provider) => provider.kind === kind) || null;
}

export function countAvailableRepositoryProviders(): number {
  return repositoryProviders.filter((provider) => provider.status === 'available').length;
}
