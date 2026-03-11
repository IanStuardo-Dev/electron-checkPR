const React = require('react');
const { render, screen } = require('@testing-library/react');
const { createDashboardSummary, createRepositorySourceContext } = require('./helpers/dashboard-context');

jest.mock('../src/renderer/features/dashboard/context/RepositorySourceContext', () => ({
  useRepositorySourceContext: jest.fn(),
}));

const { useRepositorySourceContext } = require('../src/renderer/features/dashboard/context/RepositorySourceContext');
const Dashboard = require('../src/renderer/pages/Dashboard').default;

describe('Dashboard page', () => {
  test('muestra estado vacio cuando no hay provider activo', () => {
    useRepositorySourceContext.mockReturnValue(createRepositorySourceContext());

    render(React.createElement(Dashboard));

    expect(screen.getByText(/No hay provider activo/i)).toBeInTheDocument();
  });

  test('muestra metricas cuando la conexion esta lista', () => {
    useRepositorySourceContext.mockReturnValue(createRepositorySourceContext({
      activeProvider: { kind: 'github' },
      activeProviderName: 'GitHub',
      config: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        personalAccessToken: 'token',
        targetReviewer: '',
      },
      isConnectionReady: true,
      hasCredentialsInSession: true,
      hasSuccessfulConnection: true,
      summary: createDashboardSummary({
        scopeLabel: 'acme / todos los repositorios',
        metrics: [
          {
            id: 'active-prs',
            title: 'PR activos',
            value: 7,
            detail: 'Backlog abierto',
            tone: 'sky',
          },
        ],
      }),
    }));

    render(React.createElement(Dashboard));

    expect(screen.getByText('PR activos')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
