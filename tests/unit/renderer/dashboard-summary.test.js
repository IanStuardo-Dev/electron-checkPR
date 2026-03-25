const {
  getAgeHours,
  getApprovals,
  getPendingReviewers,
  hasMergeConflict,
  hasEmptyDescription,
  getRiskScore,
  prioritizePullRequests,
  formatHours,
  formatPercentage,
  countPullRequestsOlderThan,
  getAverageAgeHours,
  classifyBranch,
  formatLastUpdate,
} = require('../../../src/renderer/shared/dashboard/summary-core');
const summaryInsights = require('../../../src/renderer/shared/dashboard/summary-insights');
const summaryIndicators = require('../../../src/renderer/shared/dashboard/summary-indicators');
const { buildDashboardSummary } = require('../../../src/renderer/shared/dashboard/summary');
const {
  buildRepositoryInsights,
  buildBranchInsights,
  buildReviewerInsights,
} = summaryInsights;

function createPullRequest(overrides = {}) {
  return {
    repository: 'repo-a',
    createdAt: '2026-03-12T00:00:00.000Z',
    description: 'Implement auth',
    isDraft: false,
    mergeStatus: 'succeeded',
    sourceBranch: 'feature/auth',
    targetBranch: 'main',
    reviewers: [
      { displayName: 'Alice', uniqueName: 'alice@example.com', vote: 0 },
      { displayName: 'Bob', uniqueName: 'bob@example.com', vote: 10 },
    ],
    ...overrides,
  };
}

describe('dashboard summary helpers', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-16T00:00:00.000Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('summary-core calcula edad, aprobaciones, reviewers pendientes y riesgo', () => {
    const pr = createPullRequest({
      createdAt: '2026-03-12T00:00:00.000Z',
      mergeStatus: 'merge conflict',
      description: 'No description provided.',
      reviewers: [
        { displayName: 'Alice', uniqueName: 'alice@example.com', vote: 0 },
        { displayName: 'Bob', uniqueName: 'bob@example.com', vote: 0 },
        { displayName: 'Charlie', uniqueName: 'charlie@example.com', vote: 5 },
      ],
    });

    expect(getAgeHours(pr.createdAt)).toBe(96);
    expect(getApprovals(pr)).toBe(1);
    expect(getPendingReviewers(pr)).toBe(2);
    expect(hasMergeConflict(pr)).toBe(true);
    expect(hasEmptyDescription(pr)).toBe(true);
    expect(getRiskScore(pr)).toBe(9);
  });

  test('summary-core cubre ramas utilitarias y formato', () => {
    expect(getAgeHours('3026-03-16T00:00:00.000Z')).toBe(0);
    expect(hasMergeConflict(createPullRequest({ mergeStatus: 'succeeded' }))).toBe(false);
    expect(hasEmptyDescription(createPullRequest({ description: '' }))).toBe(true);
    expect(hasEmptyDescription(createPullRequest({ description: 'Lista para merge' }))).toBe(false);

    const recent = createPullRequest({
      createdAt: '2026-03-15T06:00:00.000Z',
      mergeStatus: 'queued',
      isDraft: true,
      reviewers: [
        { displayName: 'Alice', uniqueName: 'alice@example.com', vote: 0 },
      ],
    });
    const mediumAge = createPullRequest({
      createdAt: '2026-03-14T00:00:00.000Z',
      reviewers: [],
      mergeStatus: 'succeeded',
      description: 'Healthy PR',
    });

    expect(getRiskScore(recent)).toBe(0);
    expect(getRiskScore(mediumAge)).toBe(1);
    expect(formatHours(5)).toBe('5h');
    expect(formatHours(48)).toBe('2.0d');
    expect(formatPercentage(55.7)).toBe('56%');
    expect(classifyBranch('feature/auth')).toBe('feature/*');
    expect(classifyBranch('bugfix/login')).toBe('bugfix/*');
    expect(classifyBranch('fix/header')).toBe('bugfix/*');
    expect(classifyBranch('hotfix/security')).toBe('hotfix/*');
    expect(classifyBranch('release/1.2.0')).toBe('release/*');
    expect(classifyBranch('chore/cleanup')).toBe('other');
    expect(formatLastUpdate(null)).toBe('Not synced yet');

    jest.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('16/03/2026');
    jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('12:00:00');
    expect(formatLastUpdate(new Date('2026-03-16T12:00:00.000Z'))).toBe('16/03/2026 12:00:00');
  });

  test('prioriza PRs, cuenta antiguedad y calcula promedios', () => {
    const prioritized = prioritizePullRequests([
      createPullRequest({
        repository: 'repo-a',
        createdAt: '2026-03-13T00:00:00.000Z',
        reviewers: [
          { displayName: 'Alice', uniqueName: 'alice@example.com', vote: 0 },
          { displayName: 'Bob', uniqueName: 'bob@example.com', vote: 0 },
        ],
        description: 'No description provided.',
        mergeStatus: 'conflicts detected',
      }),
      createPullRequest({
        repository: 'repo-b',
        createdAt: '2026-03-14T00:00:00.000Z',
        reviewers: [],
        sourceBranch: 'release/1.0.0',
      }),
      createPullRequest({
        repository: 'repo-c',
        createdAt: '2026-03-15T00:00:00.000Z',
        reviewers: [],
        sourceBranch: 'hotfix/session',
      }),
    ]);

    expect(prioritized[0]).toEqual(expect.objectContaining({
      repository: 'repo-a',
      riskScore: 9,
      approvals: 0,
      pendingReviewers: 2,
    }));
    expect(countPullRequestsOlderThan(prioritized, 24)).toBe(3);
    expect(getAverageAgeHours(prioritized)).toBeGreaterThan(0);
    expect(getAverageAgeHours([])).toBe(0);
  });

  test('summary-insights agrupa repositorios, ramas y reviewers pendientes', () => {
    const prioritized = prioritizePullRequests([
      createPullRequest({
        repository: 'repo-a',
        createdAt: '2026-03-12T00:00:00.000Z',
        reviewers: [
          { displayName: 'Alice', uniqueName: 'alice@example.com', vote: 0 },
          { displayName: 'Bob', uniqueName: 'bob@example.com', vote: 0 },
        ],
        description: 'No description provided.',
        mergeStatus: 'merge conflict',
        sourceBranch: 'feature/auth',
      }),
      createPullRequest({
        repository: 'repo-a',
        createdAt: '2026-03-14T00:00:00.000Z',
        reviewers: [
          { displayName: '', uniqueName: 'backend@example.com', vote: 0 },
        ],
        sourceBranch: 'bugfix/login',
      }),
      createPullRequest({
        repository: 'repo-b',
        createdAt: '2026-03-15T00:00:00.000Z',
        reviewers: [
          { displayName: '', uniqueName: '', vote: 0 },
          { displayName: 'Merged Reviewer', uniqueName: 'merged@example.com', vote: 10 },
        ],
        sourceBranch: 'release/1.0.0',
      }),
      createPullRequest({
        repository: 'repo-c',
        createdAt: '2026-03-15T12:00:00.000Z',
        reviewers: [],
        sourceBranch: 'chore/cleanup',
      }),
    ]);

    expect(buildRepositoryInsights(prioritized)).toEqual([
      { name: 'repo-a', total: 2, highRisk: 1, blocked: 1 },
      { name: 'repo-b', total: 1, highRisk: 0, blocked: 0 },
      { name: 'repo-c', total: 1, highRisk: 0, blocked: 0 },
    ]);

    expect(buildBranchInsights(prioritized)).toEqual(expect.arrayContaining([
      { label: 'feature/*', total: 1 },
      { label: 'bugfix/*', total: 1 },
      { label: 'release/*', total: 1 },
      { label: 'other', total: 1 },
    ]));

    expect(buildReviewerInsights(prioritized)).toEqual([
      { reviewer: 'Alice', pending: 1 },
      { reviewer: 'Bob', pending: 1 },
      { reviewer: 'backend@example.com', pending: 1 },
      { reviewer: 'Unknown reviewer', pending: 1 },
    ]);
  });

  test('buildDashboardSummary evita recomputar metrics y reviewer insights', () => {
    const metricsSpy = jest.spyOn(summaryIndicators, 'buildMetrics');
    const reviewerInsightsSpy = jest.spyOn(summaryInsights, 'buildReviewerInsights');

    const summary = buildDashboardSummary(
      [
        createPullRequest({
          createdAt: '2026-03-12T00:00:00.000Z',
          mergeStatus: 'merge conflict',
        }),
        createPullRequest({
          repository: 'repo-b',
          createdAt: '2026-03-15T00:00:00.000Z',
          sourceBranch: 'hotfix/session',
          reviewers: [],
        }),
      ],
      new Date('2026-03-16T12:00:00.000Z'),
      'All repositories',
      'Alice',
    );

    expect(metricsSpy).toHaveBeenCalledTimes(1);
    expect(reviewerInsightsSpy).toHaveBeenCalledTimes(1);
    expect(summary.executiveMetrics).toEqual(summary.metrics.slice(0, 4));
    expect(summary.queueMetrics).toBe(summary.metrics);
    expect(summary.reviewerWorkload).toBe(summary.reviewerInsights);
  });
});
