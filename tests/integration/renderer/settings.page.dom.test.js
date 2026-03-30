const React = require('react');
const { render, screen } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const { MemoryRouter } = require('react-router-dom');
const { createDashboardSummary, createRepositorySourceContext } = require('../../support/helpers/renderer-context-factories');

jest.mock('../../../src/renderer/features/repository-source/presentation/context/RepositorySourceContext', () => ({
  useRepositorySourceContext: jest.fn(),
}));

jest.mock('../../../src/renderer/features/settings/presentation/hooks/useCodexSettings', () => ({
  useCodexSettings: jest.fn(),
}));

const { useRepositorySourceContext } = require('../../../src/renderer/features/repository-source/presentation/context/RepositorySourceContext');
const { useCodexSettings } = require('../../../src/renderer/features/settings/presentation/hooks/useCodexSettings');
const Settings = require('../../../src/renderer/app/pages/Settings').default;

function renderWithRouter(element) {
  return render(React.createElement(
    MemoryRouter,
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
    element,
  ));
}

describe('Settings page', () => {
  test('muestra un hub simple y abre modales de configuracion y soporte', async () => {
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
      saveApiKey: jest.fn(),
      apiKeyNeedsSave: false,
      isSavingApiKey: false,
      apiKeySaveFeedback: null,
    });

    renderWithRouter(React.createElement(Settings));

    expect(screen.getByText('Resumen operativo')).toBeInTheDocument();
    expect(screen.getByText('Workspace operativo')).toBeInTheDocument();
    expect(screen.getAllByText('GitHub').length).toBeGreaterThan(0);
    expect(screen.getByText('Configuracion simple del workspace')).toBeInTheDocument();
    expect(screen.getByText('Integraciones y reglas')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /abrir configuracion/i }).length).toBe(2);
    expect(screen.getByRole('button', { name: /editar reglas/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /abrir configuracion/i })[0]);
    expect(screen.getByRole('dialog', { name: /configuracion de provider/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^provider$/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /^cerrar$/i }));

    await user.click(screen.getAllByRole('button', { name: /abrir configuracion/i })[1]);
    expect(screen.getByRole('dialog', { name: /configuracion de codex/i })).toBeInTheDocument();
    expect(screen.getAllByText(/politicas avanzadas/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /^cerrar$/i }));

    await user.click(screen.getByRole('button', { name: /abrir diagnostico/i }));
    expect(screen.getByRole('dialog', { name: /diagnostico del provider/i })).toBeInTheDocument();
    expect(screen.getAllByText(/persistencia y sesion/i).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: /^cerrar$/i })[0]);

    await user.click(screen.getByRole('button', { name: /editar reglas/i }));
    expect(screen.getByRole('dialog', { name: /reglas globales de snapshot/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /editar reglas/i })[1]);
    expect(screen.getByRole('button', { name: /aplicar preset node/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^listo$/i }));
    await user.click(screen.getAllByRole('button', { name: /^cerrar$/i })[0]);

    await user.click(screen.getAllByRole('button', { name: /abrir configuracion/i })[1]);
    expect(screen.getByRole('dialog', { name: /configuracion de codex/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /politicas avanzadas/i }));
    expect(screen.getByRole('dialog', { name: /politicas avanzadas de codex/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/focus areas para pr ai review/i)).toBeInTheDocument();
  });
});
