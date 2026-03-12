const React = require('react');
const { render, screen } = require('@testing-library/react');
const { createDashboardSummary, createRepositorySourceContext } = require('../../support/helpers/dashboard-context');

jest.mock('../../../src/renderer/features/dashboard/context/RepositorySourceContext', () => ({
  useRepositorySourceContext: jest.fn(),
}));

jest.mock('../../../src/renderer/features/settings/hooks/useCodexSettings', () => ({
  useCodexSettings: jest.fn(),
}));

jest.mock('../../../src/renderer/features/dashboard/hooks/usePullRequestAiReviews', () => ({
  usePullRequestAiReviews: jest.fn(),
}));

const { useRepositorySourceContext } = require('../../../src/renderer/features/dashboard/context/RepositorySourceContext');
const { useCodexSettings } = require('../../../src/renderer/features/settings/hooks/useCodexSettings');
const { usePullRequestAiReviews } = require('../../../src/renderer/features/dashboard/hooks/usePullRequestAiReviews');
const Dashboard = require('../../../src/renderer/pages/Dashboard').default;

describe('Dashboard page', () => {
  beforeEach(() => {
    useCodexSettings.mockReturnValue({
      config: {
        enabled: false,
        model: 'gpt-5.2-codex',
        analysisDepth: 'standard',
        maxFilesPerRun: 80,
        includeTests: true,
        repositoryScope: 'selected',
        apiKey: '',
        snapshotPolicy: {
          excludedPathPatterns: '',
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
    });
    usePullRequestAiReviews.mockReturnValue({
      reviews: [],
      isLoading: false,
      isConfigured: false,
    });
  });

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
        queueMetrics: [
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

  test('muestra la cola operativa enriquecida con IA y carga de reviewers', () => {
    useCodexSettings.mockReturnValue({
      config: {
        enabled: true,
        model: 'gpt-5.2-codex',
        analysisDepth: 'standard',
        maxFilesPerRun: 80,
        includeTests: true,
        repositoryScope: 'selected',
        apiKey: 'sk-live',
        snapshotPolicy: {
          excludedPathPatterns: '',
          strictMode: false,
        },
        prReview: {
          enabled: true,
          maxPullRequests: 2,
          selectionMode: 'top-risk',
          analysisDepth: 'standard',
          promptDirectives: {
            focusAreas: 'seguridad',
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
    });
    usePullRequestAiReviews.mockReturnValue({
      reviews: [
        {
          pullRequestId: 19,
          repository: 'repo-a',
          status: 'analyzed',
          riskScore: 82,
          shortSummary: 'Toca autenticacion y requiere revisar permisos.',
          topConcerns: ['Permisos', 'Errores'],
          reviewChecklist: ['Validar auth'],
        },
      ],
      isLoading: false,
      isConfigured: true,
    });
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
        executiveMetrics: [
          {
            id: 'backlog',
            title: 'Backlog activo',
            value: 7,
            detail: 'PRs pendientes en la cola actual.',
            tone: 'sky',
          },
        ],
        queueMetrics: [
          {
            id: 'active-prs',
            title: 'PR activos',
            value: 7,
            detail: 'Backlog abierto',
            tone: 'sky',
          },
        ],
        prioritizedPullRequests: [
          {
            id: 19,
            title: 'Fortalecer auth',
            description: 'Ajusta middleware y permisos',
            repository: 'repo-a',
            url: 'https://example.com/pr/19',
            status: 'active',
            createdAt: '2026-03-10T10:00:00.000Z',
            updatedAt: '2026-03-10T12:00:00.000Z',
            createdBy: { displayName: 'Ian' },
            sourceBranch: 'feature/auth',
            targetBranch: 'main',
            mergeStatus: 'conflicts',
            isDraft: false,
            reviewers: [],
            ageHours: 36,
            riskScore: 5,
            approvals: 0,
            pendingReviewers: 2,
          },
        ],
        reviewerWorkload: [
          {
            reviewer: 'Ana',
            pending: 4,
          },
        ],
      }),
    }));

    render(React.createElement(Dashboard));

    expect(screen.getByText('PRs priorizados')).toBeInTheDocument();
    expect(screen.getByText('AI 82/100')).toBeInTheDocument();
    expect(screen.getByText(/Toca autenticacion y requiere revisar permisos/i)).toBeInTheDocument();
    expect(screen.getByText('Reviewer workload')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });
});
