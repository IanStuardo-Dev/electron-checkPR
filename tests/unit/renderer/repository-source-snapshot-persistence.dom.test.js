const { renderHook } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/history/data/historyStorage', () => ({
  persistDashboardSnapshot: jest.fn(),
}));

jest.mock('../../../src/renderer/shared/dashboard/summary', () => ({
  buildDashboardSummary: jest.fn(() => ({
    activePRs: 3,
    highRiskPRs: 1,
    blockedPRs: 0,
    reviewBacklog: 1,
    averageAgeHours: 4,
    stalePRs: 0,
    repositoryCount: 1,
    hotfixPRs: 0,
  })),
}));

const { persistDashboardSnapshot } = require('../../../src/renderer/features/history/data/historyStorage');
const { useRepositorySourceSnapshotPersistence } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceSnapshotPersistence');

describe('useRepositorySourceSnapshotPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('usa el configRef actual al persistir el snapshot', () => {
    const timestamp = new Date('2026-03-11T12:00:00.000Z');
    const configRef = {
      current: {
        provider: 'azure-devops',
        organization: 'org-a',
        project: 'platform',
        repositoryId: 'repo-a',
        personalAccessToken: '',
        targetReviewer: '',
      },
    };

    const { result } = renderHook(() => useRepositorySourceSnapshotPersistence(configRef));

    result.current([{ id: 1, title: 'PR', url: 'https://example.com/pr/1' }], timestamp, 'ignored', 'ian');

    expect(persistDashboardSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      scopeLabel: 'org-a / platform / Todos los repositorios',
      activePRs: 3,
    }));
  });
});
