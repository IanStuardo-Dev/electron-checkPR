jest.mock('../../../src/renderer/shared/dashboard/summary', () => ({
  buildDashboardSummary: jest.fn(() => ({
    activePRs: 4,
    highRiskPRs: 1,
    blockedPRs: 1,
    reviewBacklog: 2,
    averageAgeHours: 6,
    stalePRs: 0,
    repositoryCount: 1,
    hotfixPRs: 0,
  })),
}));

const { buildRepositorySourceSnapshotRecord } = require('../../../src/renderer/features/repository-source/application/repositorySourcePersistence');

describe('repository source persistence', () => {
  test('construye un snapshot derivado sin depender de la feature history', () => {
    const timestamp = new Date('2026-03-11T12:00:00.000Z');

    const snapshot = buildRepositorySourceSnapshotRecord({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, [], timestamp);

    expect(snapshot).toEqual(expect.objectContaining({
      id: `${timestamp.toISOString()}-acme / Todos los repositorios`,
      activePRs: 4,
      highRiskPRs: 1,
    }));
  });
});
