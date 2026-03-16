import type { BranchInsight, PrioritizedPullRequest, RepositoryInsight, ReviewerInsight } from './summary.types';
import { classifyBranch, hasMergeConflict } from './summary-core';

export function buildRepositoryInsights(prioritizedPullRequests: PrioritizedPullRequest[]): RepositoryInsight[] {
  const grouped = new Map<string, RepositoryInsight>();

  prioritizedPullRequests.forEach((pr) => {
    const current = grouped.get(pr.repository) || {
      name: pr.repository,
      total: 0,
      highRisk: 0,
      blocked: 0,
    };

    current.total += 1;
    if (pr.riskScore >= 4) {
      current.highRisk += 1;
    }
    if (hasMergeConflict(pr)) {
      current.blocked += 1;
    }

    grouped.set(pr.repository, current);
  });

  return Array.from(grouped.values()).sort((left, right) => right.total - left.total).slice(0, 5);
}

export function buildBranchInsights(prioritizedPullRequests: PrioritizedPullRequest[]): BranchInsight[] {
  const grouped = new Map<string, number>();

  prioritizedPullRequests.forEach((pr) => {
    const label = classifyBranch(pr.sourceBranch);
    grouped.set(label, (grouped.get(label) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((left, right) => right.total - left.total);
}

export function buildReviewerInsights(prioritizedPullRequests: PrioritizedPullRequest[]): ReviewerInsight[] {
  const grouped = new Map<string, number>();

  prioritizedPullRequests.forEach((pr) => {
    pr.reviewers.forEach((reviewer) => {
      if (reviewer.vote !== 0) {
        return;
      }

      const key = reviewer.displayName || reviewer.uniqueName || 'Unknown reviewer';
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
  });

  return Array.from(grouped.entries())
    .map(([reviewer, pending]) => ({ reviewer, pending }))
    .sort((left, right) => right.pending - left.pending)
    .slice(0, 5);
}
