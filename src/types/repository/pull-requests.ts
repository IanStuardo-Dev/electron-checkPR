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

export interface PrioritizedPullRequest extends ReviewItem {
  ageHours: number;
  riskScore: number;
  approvals: number;
  pendingReviewers: number;
}
