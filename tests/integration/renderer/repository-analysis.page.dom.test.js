const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const { createDashboardSummary, createRepositorySourceContext } = require('../../support/helpers/renderer-context-factories');

jest.mock('../../../src/renderer/features/repository-source/presentation/context/RepositorySourceContext', () => ({
  useRepositorySourceContext: jest.fn(),
}));

jest.mock('../../../src/renderer/features/settings/presentation/hooks/useCodexSettings', () => ({
  useCodexSettings: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryAnalysis', () => ({
  useRepositoryAnalysis: jest.fn(),
}));

jest.mock('../../../src/renderer/features/repository-source/data/repositorySourceBridge', () => ({
  fetchBranches: jest.fn(),
}));

const { useRepositorySourceContext } = require('../../../src/renderer/features/repository-source/presentation/context/RepositorySourceContext');
const { useCodexSettings } = require('../../../src/renderer/features/settings/presentation/hooks/useCodexSettings');
const { useRepositoryAnalysis } = require('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryAnalysis');
const { fetchBranches } = require('../../../src/renderer/features/repository-source/data/repositorySourceBridge');
const RepositoryAnalysis = require('../../../src/renderer/app/pages/RepositoryAnalysis').default;

function renderWithRouter(element) {
  return render(React.createElement(
    MemoryRouter,
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
    element,
  ));
}

describe('RepositoryAnalysis page', () => {
  test('muestra estado inicial sin provider activo', () => {
    useRepositorySourceContext.mockReturnValue(createRepositorySourceContext());
    useCodexSettings.mockReturnValue({
      config: {
        enabled: false,
        model: 'gpt-5.2-codex',
        analysisDepth: 'standard',
        maxFilesPerRun: 120,
        includeTests: true,
        repositoryScope: 'selected',
        apiKey: '',
        snapshotPolicy: {
          excludedPathPatterns: '.env\nnode_modules/**',
          strictMode: false,
        },
        prReview: {
          enabled: false,
          maxPullRequests: 4,
          selectionMode: 'top-risk',
          analysisDepth: 'standard',
          promptDirectives: {
            focusAreas: '',
            customInstructions: '',
          },
        },
        promptDirectives: {
          architectureReviewEnabled: false,
          architecturePattern: '',
          requiredPractices: '',
          forbiddenPractices: '',
          domainContext: '',
          customInstructions: '',
        },
      },
      isReady: false,
    });
    useRepositoryAnalysis.mockReturnValue({
      phase: 'idle',
      preview: null,
      result: null,
      error: null,
      isPreviewing: false,
      isRunning: false,
      isCancelling: false,
      preparePreview: jest.fn(),
      execute: jest.fn(),
      cancel: jest.fn(),
      reset: jest.fn(),
    });
    fetchBranches.mockResolvedValue([]);

    renderWithRouter(React.createElement(RepositoryAnalysis));

    expect(screen.getByText(/Analisis AI sobre una rama exacta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/No seleccionado/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Selecciona un repositorio y una rama, prepara el snapshot y confirma el disclaimer antes de enviar el contexto a Codex/i)).toBeInTheDocument();
  });

  test('muestra el resultado estructurado del analisis', async () => {
    useRepositorySourceContext.mockReturnValue(createRepositorySourceContext({
      activeProvider: { kind: 'github' },
      activeProviderName: 'GitHub',
      config: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: 'repo-a',
        personalAccessToken: 'token',
        targetReviewer: '',
      },
      isConnectionReady: true,
      hasCredentialsInSession: true,
      hasSuccessfulConnection: true,
      repositories: [{ id: 'repo-a', name: 'repo-a' }],
      selectedRepositoryName: 'repo-a',
      summary: createDashboardSummary({
        scopeLabel: 'acme / repo-a',
      }),
    }));
    useCodexSettings.mockReturnValue({
      config: {
        enabled: true,
        model: 'gpt-5.2-codex',
        maxFilesPerRun: 120,
        analysisDepth: 'deep',
        includeTests: true,
        repositoryScope: 'selected',
        apiKey: 'codex-key',
        snapshotPolicy: {
          excludedPathPatterns: '.env\nnode_modules/**',
          strictMode: false,
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
    });
    useRepositoryAnalysis.mockReturnValue({
      phase: 'completed',
      preview: null,
      result: {
        provider: 'github',
        repository: 'repo-a',
        branch: 'main',
        model: 'gpt-5.2-codex',
        analyzedAt: new Date().toISOString(),
        summary: 'El repositorio muestra riesgos de seguridad en Electron.',
        score: 62,
        riskLevel: 'high',
        topConcerns: ['Node integration habilitado'],
        recommendations: ['Desactivar nodeIntegration'],
        findings: [
          {
            id: 'sec-1',
            title: 'Node integration activo',
            severity: 'critical',
            category: 'security',
            filePath: 'src/main.ts',
            detail: 'El renderer expone APIs de Node.',
            recommendation: 'Usar preload y contextBridge.',
          },
        ],
        snapshot: {
          totalFilesDiscovered: 20,
          filesAnalyzed: 10,
          truncated: false,
          durationMs: 1200,
          retryCount: 0,
          discardedByPrioritization: 10,
          discardedBySize: 0,
          discardedByBinaryDetection: 0,
        },
      },
      error: null,
      isPreviewing: false,
      isRunning: false,
      isCancelling: false,
      preparePreview: jest.fn(),
      execute: jest.fn(),
      cancel: jest.fn(),
      reset: jest.fn(),
    });
    fetchBranches.mockResolvedValue([{ name: 'main', objectId: '1', isDefault: true }]);

    renderWithRouter(React.createElement(RepositoryAnalysis));

    await waitFor(() => expect(fetchBranches).toHaveBeenCalledTimes(1));

    expect(screen.getByText(/El repositorio muestra riesgos de seguridad en Electron/i)).toBeInTheDocument();
    expect(screen.getByText('Node integration activo')).toBeInTheDocument();
    expect(screen.getByText('Desactivar nodeIntegration')).toBeInTheDocument();
  });
});

