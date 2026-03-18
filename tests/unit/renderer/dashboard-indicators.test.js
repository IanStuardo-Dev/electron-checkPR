const {
  buildMetrics,
  buildDeliveryIndicators,
  buildReviewIndicators,
  buildGovernanceAlerts,
} = require('../../../src/renderer/shared/dashboard/summary-indicators');
const { prioritizePullRequests } = require('../../../src/renderer/shared/dashboard/summary-core');

function createPullRequest(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    repository: 'repo-a',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
    title: 'PR',
    description: 'Contexto suficiente',
    url: 'https://example.com/pr/1',
    status: 'active',
    isDraft: false,
    mergeStatus: 'succeeded',
    sourceBranch: 'feature/auth',
    targetBranch: 'main',
    createdBy: { displayName: 'Ian' },
    reviewers: [],
    ageHours: 0,
    approvals: 0,
    pendingReviewers: 0,
    riskScore: 0,
    ...overrides,
  };
}

describe('dashboard indicators', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-16T00:00:00.000Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function buildPrioritized() {
    return prioritizePullRequests([
      createPullRequest({
        id: 1,
        repository: 'repo-a',
        createdAt: '2026-03-10T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'merge conflict',
        reviewers: [
          { displayName: 'Ian Reviewer', uniqueName: 'ian@example.com', vote: 0, isRequired: true },
          { displayName: 'Ana', uniqueName: 'ana@example.com', vote: 0, isRequired: false },
        ],
        sourceBranch: 'hotfix/auth',
        targetBranch: 'main',
        isDraft: false,
      }),
      createPullRequest({
        id: 2,
        repository: 'repo-b',
        createdAt: '2026-03-14T00:00:00.000Z',
        reviewers: [
          { displayName: 'Bob', uniqueName: 'bob@example.com', vote: 10, isRequired: false },
        ],
        sourceBranch: 'feature/settings',
        targetBranch: 'develop',
        isDraft: true,
      }),
      createPullRequest({
        id: 3,
        repository: 'repo-c',
        createdAt: '2026-03-13T00:00:00.000Z',
        reviewers: [
          { displayName: 'Carla', uniqueName: 'carla@example.com', vote: 0, isRequired: true },
          { displayName: 'Diego', uniqueName: 'diego@example.com', vote: 0, isRequired: false },
          { displayName: 'Ema', uniqueName: 'ema@example.com', vote: 0, isRequired: false },
        ],
        sourceBranch: 'hotfix/payments',
        targetBranch: 'master',
        isDraft: false,
      }),
    ]);
  }

  test('buildMetrics resume volumen, riesgo y carga por reviewer', () => {
    const prioritized = buildPrioritized();
    const metrics = buildMetrics(prioritized, 'ian');

    expect(metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'active-prs', value: 3 }),
      expect.objectContaining({ id: 'blocked', value: 1 }),
      expect.objectContaining({ id: 'drafts', value: 1 }),
      expect.objectContaining({ id: 'repositories', value: 3 }),
      expect.objectContaining({ id: 'reviewer-workload', value: 1, title: 'Pendientes del reviewer' }),
    ]));

    const teamMetrics = buildMetrics(prioritized);
    expect(teamMetrics.find((metric) => metric.id === 'reviewer-workload')).toEqual(expect.objectContaining({
      value: 2,
      title: 'Esperando review',
    }));
  });

  test('buildDeliveryIndicators calcula stale ratio, mainline targeting y hotfix pressure', () => {
    const prioritized = buildPrioritized();
    const indicators = buildDeliveryIndicators(prioritized);

    expect(indicators).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'avg-age', tone: expect.any(String) }),
      expect.objectContaining({ id: 'stale-ratio', value: '67%' }),
      expect.objectContaining({ id: 'mainline-targeting', value: '100%', tone: 'amber' }),
      expect.objectContaining({ id: 'hotfix-pressure', value: '67%', tone: 'rose' }),
    ]));

    const empty = buildDeliveryIndicators([]);
    expect(empty.find((indicator) => indicator.id === 'stale-ratio')).toEqual(expect.objectContaining({
      value: '0%',
      tone: 'emerald',
    }));
  });

  test('buildReviewIndicators resume cobertura, backlog y cuellos de botella requeridos', () => {
    const prioritized = buildPrioritized();
    const indicators = buildReviewIndicators(prioritized);

    expect(indicators).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'coverage', value: '67%', tone: 'amber' }),
      expect.objectContaining({ id: 'pending-load', value: '5', tone: 'amber' }),
      expect.objectContaining({ id: 'avg-reviewers', value: '2.0', tone: 'emerald' }),
      expect.objectContaining({ id: 'required-bottleneck', value: '2', tone: 'amber' }),
    ]));
  });

  test('buildGovernanceAlerts detecta contexto ausente, presión de producción y drift', () => {
    const prioritized = buildPrioritized();
    const alerts = buildGovernanceAlerts(prioritized);

    expect(alerts).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'missing-context', detail: '1 de 3 sin descripción suficiente.', tone: 'amber' }),
      expect.objectContaining({ id: 'oversized-risk', tone: 'amber' }),
      expect.objectContaining({ id: 'prod-pressure', detail: '2 hotfixes yendo directo a main/master.', tone: 'rose' }),
      expect.objectContaining({ id: 'draft-drift', detail: '1 drafts abiertos por más de 48 horas.', tone: 'sky' }),
    ]));
  });

  test('buildIndicators cubre escenarios vacios y thresholds altos de presión', () => {
    const emptyMetrics = buildMetrics([], undefined);
    expect(emptyMetrics.find((metric) => metric.id === 'average-age')).toEqual(expect.objectContaining({
      value: '0h',
    }));

    const emptyReviewIndicators = buildReviewIndicators([]);
    expect(emptyReviewIndicators.find((indicator) => indicator.id === 'coverage')).toEqual(expect.objectContaining({
      value: '0%',
      tone: 'emerald',
    }));

    const overloaded = prioritizePullRequests([
      createPullRequest({
        id: 10,
        createdAt: '2026-03-01T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'merge conflict',
        sourceBranch: 'hotfix/a',
        targetBranch: 'main',
        reviewers: [
          { displayName: 'A', uniqueName: 'a@example.com', vote: 0, isRequired: true },
          { displayName: 'B', uniqueName: 'b@example.com', vote: 0, isRequired: false },
          { displayName: 'C', uniqueName: 'c@example.com', vote: 0, isRequired: false },
          { displayName: 'D', uniqueName: 'd@example.com', vote: 0, isRequired: false },
        ],
      }),
      createPullRequest({
        id: 11,
        createdAt: '2026-03-02T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'merge conflict',
        sourceBranch: 'hotfix/b',
        targetBranch: 'master',
        reviewers: [
          { displayName: 'E', uniqueName: 'e@example.com', vote: 0, isRequired: true },
          { displayName: 'F', uniqueName: 'f@example.com', vote: 0, isRequired: false },
          { displayName: 'G', uniqueName: 'g@example.com', vote: 0, isRequired: false },
          { displayName: 'H', uniqueName: 'h@example.com', vote: 0, isRequired: false },
        ],
      }),
      createPullRequest({
        id: 12,
        createdAt: '2026-03-03T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'merge conflict',
        sourceBranch: 'feature/c',
        targetBranch: 'main',
        reviewers: [
          { displayName: 'I', uniqueName: 'i@example.com', vote: 0, isRequired: true },
          { displayName: 'J', uniqueName: 'j@example.com', vote: 0, isRequired: false },
          { displayName: 'K', uniqueName: 'k@example.com', vote: 0, isRequired: false },
          { displayName: 'L', uniqueName: 'l@example.com', vote: 0, isRequired: false },
        ],
      }),
      createPullRequest({
        id: 13,
        createdAt: '2026-03-04T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'succeeded',
        sourceBranch: 'feature/d',
        targetBranch: 'develop',
        reviewers: [],
        isDraft: true,
      }),
      createPullRequest({
        id: 14,
        createdAt: '2026-03-05T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'succeeded',
        sourceBranch: 'feature/e',
        targetBranch: 'develop',
        reviewers: [],
        isDraft: true,
      }),
      createPullRequest({
        id: 15,
        createdAt: '2026-03-06T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'succeeded',
        sourceBranch: 'feature/f',
        targetBranch: 'main',
        reviewers: [],
        isDraft: false,
      }),
      createPullRequest({
        id: 16,
        createdAt: '2026-03-07T00:00:00.000Z',
        description: 'No description provided.',
        mergeStatus: 'succeeded',
        sourceBranch: 'feature/g',
        targetBranch: 'develop',
        reviewers: [],
        isDraft: false,
      }),
    ]);

    const delivery = buildDeliveryIndicators(overloaded);
    expect(delivery.find((indicator) => indicator.id === 'avg-age')).toEqual(expect.objectContaining({ tone: 'rose' }));
    expect(delivery.find((indicator) => indicator.id === 'stale-ratio')).toEqual(expect.objectContaining({ tone: 'rose' }));
    expect(delivery.find((indicator) => indicator.id === 'hotfix-pressure')).toEqual(expect.objectContaining({ tone: 'rose' }));

    const review = buildReviewIndicators(overloaded);
    expect(review.find((indicator) => indicator.id === 'coverage')).toEqual(expect.objectContaining({ tone: 'rose' }));
    expect(review.find((indicator) => indicator.id === 'pending-load')).toEqual(expect.objectContaining({ tone: 'rose' }));
    expect(review.find((indicator) => indicator.id === 'avg-reviewers')).toEqual(expect.objectContaining({ tone: 'emerald' }));
    expect(review.find((indicator) => indicator.id === 'required-bottleneck')).toEqual(expect.objectContaining({ tone: 'rose' }));

    const alerts = buildGovernanceAlerts(overloaded);
    expect(alerts.find((alert) => alert.id === 'missing-context')).toEqual(expect.objectContaining({ tone: 'rose' }));
    expect(alerts.find((alert) => alert.id === 'oversized-risk')).toEqual(expect.objectContaining({ tone: 'amber' }));
    expect(alerts.find((alert) => alert.id === 'draft-drift')).toEqual(expect.objectContaining({ tone: 'amber' }));

    const sparseReview = buildReviewIndicators(prioritizePullRequests([
      createPullRequest({ id: 20, createdAt: '2026-03-10T00:00:00.000Z', reviewers: [] }),
      createPullRequest({ id: 21, createdAt: '2026-03-10T00:00:00.000Z', reviewers: [] }),
    ]));
    expect(sparseReview.find((indicator) => indicator.id === 'avg-reviewers')).toEqual(expect.objectContaining({
      tone: 'amber',
      value: '0.0',
    }));

    const overloadedAlerts = buildGovernanceAlerts(prioritizePullRequests([
      createPullRequest({ id: 30, createdAt: '2026-03-10T00:00:00.000Z', description: 'No description provided.', mergeStatus: 'merge conflict', reviewers: [{ displayName: 'A', uniqueName: 'a@example.com', vote: 0 }, { displayName: 'A2', uniqueName: 'a2@example.com', vote: 0 }, { displayName: 'A3', uniqueName: 'a3@example.com', vote: 0 }] }),
      createPullRequest({ id: 31, createdAt: '2026-03-10T00:00:00.000Z', description: 'No description provided.', mergeStatus: 'merge conflict', reviewers: [{ displayName: 'B', uniqueName: 'b@example.com', vote: 0 }, { displayName: 'B2', uniqueName: 'b2@example.com', vote: 0 }, { displayName: 'B3', uniqueName: 'b3@example.com', vote: 0 }] }),
      createPullRequest({ id: 32, createdAt: '2026-03-10T00:00:00.000Z', description: 'No description provided.', mergeStatus: 'merge conflict', reviewers: [{ displayName: 'C', uniqueName: 'c@example.com', vote: 0 }, { displayName: 'C2', uniqueName: 'c2@example.com', vote: 0 }, { displayName: 'C3', uniqueName: 'c3@example.com', vote: 0 }] }),
      createPullRequest({ id: 33, createdAt: '2026-03-10T00:00:00.000Z', description: 'No description provided.', mergeStatus: 'merge conflict', reviewers: [{ displayName: 'D', uniqueName: 'd@example.com', vote: 0 }, { displayName: 'D2', uniqueName: 'd2@example.com', vote: 0 }, { displayName: 'D3', uniqueName: 'd3@example.com', vote: 0 }] }),
    ]));
    expect(overloadedAlerts.find((alert) => alert.id === 'oversized-risk')).toEqual(expect.objectContaining({
      tone: 'rose',
    }));
  });
});
