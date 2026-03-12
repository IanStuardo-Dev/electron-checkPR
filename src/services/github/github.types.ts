export interface GitHubRepositoryResponse {
  id: number;
  name: string;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
}

export interface GitHubBranchResponse {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
  };
}

export interface GitHubTreeResponse {
  tree: Array<{
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
  }>;
  truncated?: boolean;
}

export interface GitHubPullRequestListResponseItem {
  number: number;
  title: string;
  body: string | null;
  state: string;
  created_at: string;
  html_url: string;
  draft?: boolean;
  user?: {
    login: string;
    avatar_url?: string;
  };
  requested_reviewers?: Array<{
    login: string;
    avatar_url?: string;
  }>;
  assignees?: Array<{
    login: string;
    avatar_url?: string;
  }>;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

export interface GitHubReviewResponseItem {
  user?: {
    login: string;
    avatar_url?: string;
  };
  state: string;
}

export interface GitHubPullRequestFileResponseItem {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}
