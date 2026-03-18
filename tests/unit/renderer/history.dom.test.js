const history = require('../../../src/renderer/shared/storage/dashboardHistoryStorage');

describe('dashboard history storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('loadDashboardHistory devuelve vacio sin data', () => {
    expect(history.loadDashboardHistory()).toEqual([]);
  });

  test('loadDashboardHistory devuelve vacio si el storage esta corrupto', () => {
    window.localStorage.setItem('checkpr.dashboard.history', '{broken-json');
    expect(history.loadDashboardHistory()).toEqual([]);
  });

  test('persistDashboardSnapshot agrega al inicio y limita el historial', () => {
    for (let index = 0; index < 125; index += 1) {
      history.persistDashboardSnapshot({
        id: `snap-${index}`,
        capturedAt: new Date(2026, 0, 1, 0, index).toISOString(),
        scopeLabel: `scope-${index}`,
        activePRs: index,
        highRiskPRs: 0,
        blockedPRs: 0,
        reviewBacklog: 0,
        averageAgeHours: 0,
        stalePRs: 0,
        repositoryCount: 1,
        hotfixPRs: 0,
      });
    }

    const snapshots = history.loadDashboardHistory();
    expect(snapshots).toHaveLength(120);
    expect(snapshots[0].id).toBe('snap-124');
    expect(snapshots[119].id).toBe('snap-5');
  });
});
