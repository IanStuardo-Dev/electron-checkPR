const React = require('react');
const { render, screen } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/history/data/historyStorage', () => ({
  loadDashboardHistory: jest.fn(),
}));

jest.mock('../../../src/renderer/features/history/presentation/components/HistoryCharts', () => () => React.createElement('div', null, 'History charts'));

const { loadDashboardHistory } = require('../../../src/renderer/features/history/data/historyStorage');
const History = require('../../../src/renderer/app/pages/History').default;

describe('History page', () => {
  test('muestra estado vacio cuando no hay snapshots', () => {
    loadDashboardHistory.mockReturnValue([]);

    render(React.createElement(History));

    expect(screen.getByText((content) => content.includes('Todavía no hay histórico.'))).toBeInTheDocument();
  });

  test('muestra ultimo alcance y tabla cuando hay snapshots', async () => {
    loadDashboardHistory.mockReturnValue([
      {
        id: '1',
        capturedAt: '2026-03-11T12:00:00.000Z',
        scopeLabel: 'acme / repo-a',
        activePRs: 5,
        highRiskPRs: 2,
        blockedPRs: 1,
        reviewBacklog: 3,
        averageAgeHours: 10,
        stalePRs: 1,
        repositoryCount: 1,
        hotfixPRs: 0,
      },
    ]);

    render(React.createElement(History));

    expect(screen.getAllByText('acme / repo-a').length).toBeGreaterThan(0);
    expect(screen.getByText('Últimos snapshots')).toBeInTheDocument();
    expect(await screen.findByText('History charts')).toBeInTheDocument();
  });
});
