import type { RepositoryProviderDefinition, RepositoryProviderKind } from '../../../types/repository';

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
    status: 'planned',
    description: 'Provider futuro para grupos, proyectos, ramas y Merge Requests.',
    helperText: 'Pendiente: soporte a grupos, proyectos y tokens de acceso de solo lectura.',
  },
  {
    kind: 'bitbucket',
    name: 'Bitbucket',
    status: 'todo',
    description: 'Backlog futuro para completar el set de suites de repositorios.',
    helperText: 'TODO futuro: integrar workspaces, repositorios, ramas y PRs.',
  },
];

export function getRepositoryProvider(kind: RepositoryProviderKind): RepositoryProviderDefinition {
  return repositoryProviders.find((provider) => provider.kind === kind) || repositoryProviders[0];
}
