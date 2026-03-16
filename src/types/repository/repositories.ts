export interface RepositoryProject {
  id: string;
  name: string;
  state?: string;
}

export interface RepositorySummary {
  id: string;
  name: string;
  webUrl?: string;
  defaultBranch?: string;
}

export interface RepositoryBranch {
  name: string;
  objectId: string;
  isDefault: boolean;
}
