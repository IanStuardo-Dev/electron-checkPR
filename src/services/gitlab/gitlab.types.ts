export interface GitLabProjectResponse {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  default_branch?: string;
}

export interface GitLabBranchResponse {
  name: string;
  default: boolean;
  commit: {
    id: string;
  };
}

export interface GitLabTreeItemResponse {
  path: string;
  type: 'blob' | 'tree';
}

export interface GitLabFileResponse {
  file_path: string;
  size: number;
  content: string;
  encoding: string;
}

export interface GitLabUserRef {
  username: string;
  name: string;
  avatar_url?: string;
}

export interface GitLabMergeRequestResponse {
  iid: number;
  title: string;
  description: string | null;
  state: string;
  created_at: string;
  web_url: string;
  draft?: boolean;
  work_in_progress?: boolean;
  detailed_merge_status?: string;
  source_branch: string;
  target_branch: string;
  author?: GitLabUserRef;
  reviewers?: GitLabUserRef[];
  assignees?: GitLabUserRef[];
}

export interface GitLabApprovalsResponse {
  approved_by?: Array<{
    user?: GitLabUserRef;
  }>;
}
