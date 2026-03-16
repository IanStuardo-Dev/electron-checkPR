export type RepositoryProviderKind = 'azure-devops' | 'github' | 'gitlab' | 'bitbucket';
export type RepositoryProviderSelection = RepositoryProviderKind | '';

export interface RepositoryProviderDefinition {
  kind: RepositoryProviderKind;
  name: string;
  status: 'available' | 'planned' | 'todo';
  description: string;
  helperText: string;
}
