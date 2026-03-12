const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const { MemoryRouter } = require('react-router-dom');
const { createDashboardSummary, createRepositorySourceContext } = require('../../support/helpers/dashboard-context');

jest.mock('../../../src/renderer/features/dashboard/context/RepositorySourceContext', () => ({
  useRepositorySourceContext: jest.fn(),
}));

jest.mock('../../../src/renderer/features/settings/hooks/useCodexSettings', () => ({
  useCodexSettings: jest.fn(),
}));

const { useRepositorySourceContext } = require('../../../src/renderer/features/dashboard/context/RepositorySourceContext');
const { useCodexSettings } = require('../../../src/renderer/features/settings/hooks/useCodexSettings');
const Settings = require('../../../src/renderer/pages/Settings').default;

function renderWithRouter(element) {
  return render(React.createElement(
    MemoryRouter,
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
    element,
  ));
}

describe('Settings page', () => {
  test('muestra el resumen operativo y abre modales de soporte y politicas avanzadas', async () => {
    const user = userEvent.setup();
    useRepositorySourceContext.mockReturnValue(createRepositorySourceContext({
      activeProvider: { kind: 'github' },
      activeProviderName: 'GitHub',
      config: {
        provider: 'github',
        organization: 'acme',
        project: 'repo-a',
        repositoryId: 'repo-a',
        personalAccessToken: 'token',
        targetReviewer: '',
      },
      isConnectionReady: true,
      hasCredentialsInSession: true,
      hasSuccessfulConnection: true,
      selectedProjectName: 'repo-a',
      selectedRepositoryName: 'repo-a',
      summary: createDashboardSummary({
        scopeLabel: 'acme / repo-a',
      }),
    }));

    useCodexSettings.mockReturnValue({
      config: {
        enabled: true,
        model: 'gpt-5.2-codex',
        analysisDepth: 'deep',
        maxFilesPerRun: 120,
        includeTests: true,
        repositoryScope: 'selected',
        apiKey: 'codex-key',
        snapshotPolicy: {
          excludedPathPatterns: '.env\nnode_modules/**',
          strictMode: true,
        },
        prReview: {
          enabled: true,
          maxPullRequests: 4,
          selectionMode: 'top-risk',
          analysisDepth: 'standard',
          promptDirectives: {
            focusAreas: '',
            customInstructions: '',
          },
        },
        promptDirectives: {
          architectureReviewEnabled: true,
          architecturePattern: 'hexagonal',
          requiredPractices: '',
          forbiddenPractices: '',
          domainContext: '',
          customInstructions: '',
        },
      },
      isReady: true,
      updateConfig: jest.fn(),
    });

    renderWithRouter(React.createElement(Settings));

    expect(screen.getByText('Resumen operativo')).toBeInTheDocument();
    expect(screen.getByText('Workspace operativo')).toBeInTheDocument();
    expect(screen.getAllByText('GitHub').length).toBeGreaterThan(0);
    expect(screen.getByText('Provider activo y fuentes disponibles')).toBeInTheDocument();
    expect(screen.getByText('Reglas globales de snapshot')).toBeInTheDocument();
    expect(screen.getAllByText(/politicas avanzadas/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /abrir diagnostico/i }));
    expect(screen.getByRole('dialog', { name: /diagnostico del provider/i })).toBeInTheDocument();
    expect(screen.getAllByText(/persistencia y sesion/i).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: /^cerrar$/i })[0]);

    await user.click(screen.getByRole('button', { name: /editar reglas/i }));
    expect(screen.getByRole('dialog', { name: /reglas globales de snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aplicar preset node/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^listo$/i }));

    await user.click(screen.getByRole('button', { name: /politicas avanzadas/i }));
    expect(screen.getByRole('dialog', { name: /politicas avanzadas de codex/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/focus areas para pr ai review/i)).toBeInTheDocument();
  });
});
