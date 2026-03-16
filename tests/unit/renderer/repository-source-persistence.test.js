jest.mock('../../../src/renderer/features/history/data/historyStorage', () => ({
  persistDashboardSnapshot: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/data/repositorySourceStorage', () => ({
  persistSavedAzureContext: jest.fn(),
}));

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

const { persistDashboardSnapshot } = require('../../../src/renderer/features/history/data/historyStorage');
const { persistSavedAzureContext } = require('../../../src/renderer/features/repository-source/data/repositorySourceStorage');
const { persistRepositorySourceSnapshot } = require('../../../src/renderer/features/repository-source/application/repositorySourcePersistence');

describe('repository source persistence', () => {
  test('persiste contexto y snapshot agregado', () => {
    const timestamp = new Date('2026-03-11T12:00:00.000Z');

    persistRepositorySourceSnapshot({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    }, [], timestamp);

    expect(persistSavedAzureContext).toHaveBeenCalled();
    expect(persistDashboardSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      id: `${timestamp.toISOString()}-acme / Todos los repositorios`,
      activePRs: 4,
      highRiskPRs: 1,
    }));
  });
});
