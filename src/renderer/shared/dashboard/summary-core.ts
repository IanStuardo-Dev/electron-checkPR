import type { ReviewItem } from '../../../types/repository';
import type { PrioritizedPullRequest } from './summary.types';

export function getAgeHours(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  return Math.max(0, Math.round((Date.now() - created) / (1000 * 60 * 60)));
}

export function getApprovals(pr: ReviewItem): number {
  return pr.reviewers.filter((reviewer) => reviewer.vote >= 5).length;
}

export function getPendingReviewers(pr: ReviewItem): number {
  return pr.reviewers.filter((reviewer) => reviewer.vote === 0).length;
}

export function hasMergeConflict(pr: ReviewItem): boolean {
  return pr.mergeStatus.toLowerCase().includes('conflict');
}

export function hasEmptyDescription(pr: ReviewItem): boolean {
  return !pr.description || pr.description === 'No description provided.';
}

export function getRiskScore(pr: ReviewItem): number {
  const ageHours = getAgeHours(pr.createdAt);
  const pendingReviewers = getPendingReviewers(pr);
  let score = 0;

  if (ageHours >= 72) {
    score += 3;
  } else if (ageHours >= 24) {
    score += 1;
  }

  if (hasMergeConflict(pr)) {
    score += 3;
  }

  if (!pr.isDraft && pendingReviewers >= 2) {
    score += 2;
  }

  if (hasEmptyDescription(pr)) {
    score += 1;
  }

  return score;
}

export function prioritizePullRequests(pullRequests: ReviewItem[]): PrioritizedPullRequest[] {
  return pullRequests
    .map((pr) => ({
      ...pr,
      ageHours: getAgeHours(pr.createdAt),
      approvals: getApprovals(pr),
      pendingReviewers: getPendingReviewers(pr),
      riskScore: getRiskScore(pr),
    }))
    .sort((left, right) => right.riskScore - left.riskScore || right.ageHours - left.ageHours);
}

export function formatHours(hours: number): string {
  if (hours >= 24) {
    return `${(hours / 24).toFixed(1)}d`;
  }

  return `${hours}h`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function countPullRequestsOlderThan(prioritizedPullRequests: PrioritizedPullRequest[], minHours: number): number {
  return prioritizedPullRequests.filter((pr) => pr.ageHours >= minHours).length;
}

export function getAverageAgeHours(prioritizedPullRequests: PrioritizedPullRequest[]): number {
  if (prioritizedPullRequests.length === 0) {
    return 0;
  }

  return Math.round(
    prioritizedPullRequests.reduce((sum, pr) => sum + pr.ageHours, 0) / prioritizedPullRequests.length,
  );
}

export function classifyBranch(branchName: string): string {
  if (branchName.startsWith('feature/')) {
    return 'feature/*';
  }
  if (branchName.startsWith('bugfix/') || branchName.startsWith('fix/')) {
    return 'bugfix/*';
  }
  if (branchName.startsWith('hotfix/')) {
    return 'hotfix/*';
  }
  if (branchName.startsWith('release/')) {
    return 'release/*';
  }
  return 'other';
}

export function formatLastUpdate(date: Date | null): string {
  if (!date) {
    return 'Not synced yet';
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
