import type { PullRequest } from '../../../types/azure';
import type { DashboardSummary } from './types';
import { buildMetrics, buildDeliveryIndicators, buildGovernanceAlerts, buildReviewIndicators } from './metrics-indicators';
import { formatLastUpdate, getAverageAgeHours, hasEmptyDescription, hasMergeConflict, prioritizePullRequests, countPullRequestsOlderThan } from './metrics-core';
import { buildBranchInsights, buildRepositoryInsights, buildReviewerInsights } from './metrics-insights';

export function buildDashboardSummary(
  pullRequests: PullRequest[],
  lastUpdatedAt: Date | null,
  scopeLabel: string,
  targetReviewer?: string,
): DashboardSummary {
  const prioritizedPullRequests = prioritizePullRequests(pullRequests);

  return {
    metrics: buildMetrics(prioritizedPullRequests, targetReviewer),
    prioritizedPullRequests,
    repositoryInsights: buildRepositoryInsights(prioritizedPullRequests),
    branchInsights: buildBranchInsights(prioritizedPullRequests),
    reviewerInsights: buildReviewerInsights(prioritizedPullRequests),
    deliveryIndicators: buildDeliveryIndicators(prioritizedPullRequests),
    reviewIndicators: buildReviewIndicators(prioritizedPullRequests),
    governanceAlerts: buildGovernanceAlerts(prioritizedPullRequests),
    lastUpdatedLabel: formatLastUpdate(lastUpdatedAt),
    scopeLabel,
    noDescriptionCount: prioritizedPullRequests.filter(hasEmptyDescription).length,
    activePRs: prioritizedPullRequests.length,
    highRiskPRs: prioritizedPullRequests.filter((pr) => pr.riskScore >= 4).length,
    blockedPRs: prioritizedPullRequests.filter(hasMergeConflict).length,
    reviewBacklog: prioritizedPullRequests.reduce((sum, pr) => sum + pr.pendingReviewers, 0),
    averageAgeHours: getAverageAgeHours(prioritizedPullRequests),
    stalePRs: countPullRequestsOlderThan(prioritizedPullRequests, 72),
    repositoryCount: new Set(prioritizedPullRequests.map((pr) => pr.repository)).size,
    hotfixPRs: prioritizedPullRequests.filter((pr) => pr.sourceBranch.startsWith('hotfix/')).length,
  };
}

export function getRiskBadgeClass(riskScore: number): string {
  if (riskScore >= 5) {
    return 'bg-rose-100 text-rose-700';
  }

  if (riskScore >= 3) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-emerald-100 text-emerald-700';
}
