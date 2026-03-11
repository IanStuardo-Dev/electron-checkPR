export type RepositoryProviderKind = 'azure-devops' | 'github' | 'gitlab' | 'bitbucket';

export interface RepositoryConnectionConfig {
  provider: RepositoryProviderKind;
  organization: string;
  project: string;
  repositoryId?: string;
  personalAccessToken: string;
  targetReviewer?: string;
}

export interface ReviewItemReviewer {
  displayName: string;
  uniqueName?: string;
  vote: number;
  isRequired?: boolean;
}

export interface ReviewItem {
  id: number;
  title: string;
  description: string;
  status: string;
  repository: string;
  createdAt: string;
  sourceBranch: string;
  targetBranch: string;
  url: string;
  isDraft: boolean;
  mergeStatus: string;
  createdBy: {
    displayName: string;
    uniqueName?: string;
    imageUrl?: string;
  };
  reviewers: ReviewItemReviewer[];
}

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

export interface RepositoryProviderDefinition {
  kind: RepositoryProviderKind;
  name: string;
  status: 'available' | 'planned' | 'todo';
  description: string;
  helperText: string;
}

export interface RepositorySnapshotOptions {
  branchName: string;
  maxFiles: number;
  includeTests: boolean;
}
