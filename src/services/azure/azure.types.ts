export interface AzurePullRequestResponse {
  value: Array<{
    pullRequestId: number;
    title: string;
    description?: string;
    status: string;
    creationDate: string;
    repository?: {
      name: string;
      id: string;
      webUrl?: string;
    };
    sourceRefName: string;
    targetRefName: string;
    url: string;
    isDraft?: boolean;
    mergeStatus?: string;
    createdBy?: {
      displayName: string;
      uniqueName?: string;
      imageUrl?: string;
    };
    reviewers?: Array<{
      displayName: string;
      uniqueName?: string;
      vote: number;
      isRequired?: boolean;
    }>;
  }>;
}

export interface AzureRepositoriesResponse {
  value: Array<{
    id: string;
    name: string;
    webUrl?: string;
    defaultBranch?: string;
  }>;
}

export interface AzureProjectsResponse {
  value: Array<{
    id: string;
    name: string;
    state?: string;
  }>;
}

export interface AzureRefsResponse {
  value: Array<{
    name: string;
    objectId: string;
  }>;
}

export interface AzureItemsResponse {
  value: Array<{
    path: string;
    isFolder?: boolean;
    contentMetadata?: {
      fileName?: string;
    };
  }>;
}

export interface AzurePullRequestIterationsResponse {
  value: Array<{
    id: number;
  }>;
}

export interface AzurePullRequestChangesResponse {
  changeEntries: Array<{
    changeType: string;
    item?: {
      path?: string;
    };
  }>;
}
