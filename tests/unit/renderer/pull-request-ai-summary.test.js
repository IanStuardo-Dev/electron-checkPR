const { enrichDashboardSummaryWithAi } = require('../../../src/renderer/features/dashboard/pullRequestAiSummary');
const { createDashboardSummary } = require('../../support/helpers/dashboard-context');

describe('enrichDashboardSummaryWithAi', () => {
  test('enriquece la cola priorizada y calcula cobertura IA', () => {
    const summary = createDashboardSummary({
      prioritizedPullRequests: [
        {
          id: 101,
          title: 'Refactor auth',
          description: 'Ajusta el flujo de autenticacion',
          repository: 'repo-a',
          url: 'https://example.com/pr/101',
          status: 'active',
          createdAt: '2026-03-10T10:00:00.000Z',
          updatedAt: '2026-03-10T12:00:00.000Z',
          createdBy: { displayName: 'Ian' },
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          mergeStatus: 'succeeded',
          isDraft: false,
          reviewers: [],
          ageHours: 48,
          riskScore: 5,
          approvals: 0,
          pendingReviewers: 2,
        },
        {
          id: 102,
          title: 'Mejora dashboard',
          description: 'Ordena las metricas',
          repository: 'repo-b',
          url: 'https://example.com/pr/102',
          status: 'active',
          createdAt: '2026-03-11T10:00:00.000Z',
          updatedAt: '2026-03-11T12:00:00.000Z',
          createdBy: { displayName: 'Ian' },
          sourceBranch: 'feature/dashboard',
          targetBranch: 'main',
          mergeStatus: 'conflicts',
          isDraft: false,
          reviewers: [],
          ageHours: 12,
          riskScore: 3,
          approvals: 1,
          pendingReviewers: 1,
        },
      ],
    });

    const enriched = enrichDashboardSummaryWithAi(summary, [
      {
        pullRequestId: 101,
        repository: 'repo-a',
        status: 'analyzed',
        riskScore: 88,
        shortSummary: 'Toca autenticacion y permisos.',
        topConcerns: ['Autorizacion', 'Manejo de errores'],
        reviewChecklist: ['Validar permisos'],
      },
      {
        pullRequestId: 102,
        repository: 'repo-b',
        status: 'error',
        topConcerns: [],
        reviewChecklist: [],
        error: 'quota',
      },
    ], true);

    expect(enriched.operationalPullRequests[0].aiReview.shortSummary).toContain('autenticacion');
    expect(enriched.aiCoverage.analyzed).toBe(1);
    expect(enriched.aiCoverage.errored).toBe(1);
    expect(enriched.aiCoverage.highRisk).toBe(1);
    expect(enriched.prAiSignals[0].title).toContain('Cobertura IA');
  });
});
