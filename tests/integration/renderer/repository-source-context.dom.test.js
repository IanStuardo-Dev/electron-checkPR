const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/dashboard/storage', () => ({
  loadConnectionConfig: jest.fn(),
  persistConnectionConfig: jest.fn().mockResolvedValue(undefined),
  hydrateConnectionSecret: jest.fn(),
}));

jest.mock('../../../src/renderer/features/dashboard/hooks/useRepositorySourceOperations', () => ({
  useRepositorySourceOperations: jest.fn(),
}));

const storage = require('../../../src/renderer/features/dashboard/storage');
const { useRepositorySourceOperations } = require('../../../src/renderer/features/dashboard/hooks/useRepositorySourceOperations');
const {
  RepositorySourceProvider,
  useRepositorySourceContext,
} = require('../../../src/renderer/features/dashboard/context/RepositorySourceContext');

describe('RepositorySourceProvider integration', () => {
  beforeEach(() => {
    storage.loadConnectionConfig.mockReturnValue({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });
    storage.hydrateConnectionSecret.mockResolvedValue('gh-token');
    useRepositorySourceOperations.mockReturnValue({
      pullRequests: [
        {
          id: 1,
          title: 'Fix auth flow',
          description: 'Detalle',
          status: 'open',
          repository: 'repo-a',
          createdAt: '2026-03-11T10:00:00.000Z',
          sourceBranch: 'feature/auth',
          targetBranch: 'main',
          url: 'https://github.com/acme/repo-a/pull/1',
          isDraft: false,
          mergeStatus: 'unknown',
          createdBy: { displayName: 'Ian', uniqueName: 'ian' },
          reviewers: [],
        },
      ],
      projects: [{ id: 'repo-a', name: 'repo-a', state: 'active' }],
      repositories: [{ id: 'repo-a', name: 'repo-a', webUrl: 'https://github.com/acme/repo-a' }],
      error: null,
      projectDiscoveryWarning: null,
      isLoading: false,
      projectsLoading: false,
      repositoriesLoading: false,
      lastUpdatedAt: new Date('2026-03-11T12:00:00.000Z'),
      hasSuccessfulConnection: true,
      diagnostics: {
        operation: null,
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        requestPath: '',
        lastError: null,
      },
      isConnectionPanelOpen: false,
      resetForConfigChange: jest.fn(),
      refreshPullRequests: jest.fn().mockResolvedValue(undefined),
      discoverProjects: jest.fn().mockResolvedValue(undefined),
      selectProject: jest.fn(),
      openPullRequest: jest.fn(),
      openConnectionPanel: jest.fn(),
    });
  });

  test('rehidrata el secreto de sesion y deja el provider listo', async () => {
    const Probe = () => {
      const ctx = useRepositorySourceContext();
      return React.createElement(
        'div',
        null,
        React.createElement('div', { 'data-testid': 'provider' }, ctx.config.provider || 'none'),
        React.createElement('div', { 'data-testid': 'ready' }, String(ctx.isConnectionReady)),
        React.createElement('div', { 'data-testid': 'active-prs' }, String(ctx.summary.activePRs)),
        React.createElement('div', { 'data-testid': 'scope' }, ctx.summary.scopeLabel),
      );
    };

    render(React.createElement(RepositorySourceProvider, null, React.createElement(Probe)));

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    expect(screen.getByTestId('provider')).toHaveTextContent('github');
    expect(screen.getByTestId('active-prs')).toHaveTextContent('1');
    expect(screen.getByTestId('scope')).toHaveTextContent(/acme/i);
  });
});
