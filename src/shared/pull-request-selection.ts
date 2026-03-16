import type { PrioritizedPullRequest } from '../types/repository';

export type PullRequestSelectionMode = 'top-risk' | 'oldest' | 'mixed';

export function selectPullRequestsForAiReview(
  pullRequests: PrioritizedPullRequest[],
  mode: PullRequestSelectionMode,
  maxPullRequests: number,
): PrioritizedPullRequest[] {
  const limit = Math.max(1, maxPullRequests);

  if (mode === 'oldest') {
    return [...pullRequests]
      .sort((left, right) => right.ageHours - left.ageHours || right.riskScore - left.riskScore)
      .slice(0, limit);
  }

  if (mode === 'mixed') {
    const byRisk = [...pullRequests]
      .sort((left, right) => right.riskScore - left.riskScore || right.ageHours - left.ageHours);
    const byAge = [...pullRequests]
      .sort((left, right) => right.ageHours - left.ageHours || right.riskScore - left.riskScore);
    const mixed: PrioritizedPullRequest[] = [];
    const seenIds = new Set<number>();

    while (mixed.length < limit && (byRisk.length > 0 || byAge.length > 0)) {
      const nextRisk = byRisk.shift();
      if (nextRisk && !seenIds.has(nextRisk.id)) {
        seenIds.add(nextRisk.id);
        mixed.push(nextRisk);
      }

      if (mixed.length >= limit) {
        break;
      }

      const nextAge = byAge.shift();
      if (nextAge && !seenIds.has(nextAge.id)) {
        seenIds.add(nextAge.id);
        mixed.push(nextAge);
      }
    }

    return mixed.slice(0, limit);
  }

  return [...pullRequests]
    .sort((left, right) => right.riskScore - left.riskScore || right.ageHours - left.ageHours)
    .slice(0, limit);
}
