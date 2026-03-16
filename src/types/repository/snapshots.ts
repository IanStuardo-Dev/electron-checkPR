export interface RepositorySnapshotOptions {
  branchName: string;
  maxFiles: number;
  includeTests: boolean;
  excludedPathPatterns?: string;
}

export interface PullRequestSnapshotOptions {
  excludedPathPatterns?: string;
}
