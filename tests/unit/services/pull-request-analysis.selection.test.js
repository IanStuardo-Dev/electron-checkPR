const { selectPullRequestsForAiReview } = require('../../../src/services/analysis/pull-request-analysis.selection');

function createPullRequest(id, riskScore, ageHours) {
  return {
    id,
    title: `PR ${id}`,
    description: 'Cambio importante',
    repository: 'repo-a',
    url: `https://example.com/pr/${id}`,
    status: 'active',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T12:00:00.000Z',
    createdBy: { displayName: 'Ian' },
    sourceBranch: `feature/${id}`,
    targetBranch: 'main',
    mergeStatus: 'succeeded',
    isDraft: false,
    reviewers: [],
    ageHours,
    riskScore,
    approvals: 0,
    pendingReviewers: 1,
  };
}

describe('selectPullRequestsForAiReview', () => {
  const sample = [
    createPullRequest(1, 5, 12),
    createPullRequest(2, 3, 80),
    createPullRequest(3, 4, 20),
    createPullRequest(4, 2, 120),
  ];

  test('top-risk prioriza riesgo y luego antiguedad', () => {
    const selected = selectPullRequestsForAiReview(sample, 'top-risk', 2);

    expect(selected.map((item) => item.id)).toEqual([1, 3]);
  });

  test('oldest prioriza antiguedad y luego riesgo', () => {
    const selected = selectPullRequestsForAiReview(sample, 'oldest', 2);

    expect(selected.map((item) => item.id)).toEqual([4, 2]);
  });

  test('mixed alterna entre riesgo y antiguedad sin duplicar', () => {
    const selected = selectPullRequestsForAiReview(sample, 'mixed', 3);

    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((item) => item.id)).size).toBe(3);
    expect(selected[0].id).toBe(1);
    expect(selected[1].id).toBe(4);
  });
});
