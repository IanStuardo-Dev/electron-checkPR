const { renderHook, act, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/repository-source/data/repositorySourceStorage', () => ({
  loadConnectionConfig: jest.fn(),
  persistConnectionConfig: jest.fn().mockResolvedValue(undefined),
  hydrateConnectionSecret: jest.fn(),
}));

const storage = require('../../../src/renderer/features/repository-source/data/repositorySourceStorage');
const { useRepositorySourceConfig } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceConfig');
const { useRepositorySourceBootstrap } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceBootstrap');
const { useRepositorySourceDerived } = require('../../../src/renderer/features/repository-source/presentation/hooks/useRepositorySourceDerived');

describe('repository source config hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.loadConnectionConfig.mockReturnValue({
      provider: '',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });
    storage.hydrateConnectionSecret.mockResolvedValue('');
  });

  test('useRepositorySourceConfig resetea scope al cambiar provider y persiste config segura', async () => {
    storage.loadConnectionConfig.mockReturnValue({
      provider: 'azure-devops',
      organization: 'org-a',
      project: 'project-a',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: 'ian',
    });

    const handlers = {
      onConfigChangeStart: jest.fn(),
      onProjectSelected: jest.fn(),
    };

    const { result } = renderHook(() => useRepositorySourceConfig(handlers));

    await act(async () => {
      result.current.updateConfig('provider', 'github');
    });

    expect(handlers.onConfigChangeStart).toHaveBeenCalledWith('provider', 'github');
    expect(result.current.config).toEqual({
      provider: 'github',
      organization: '',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });

    await waitFor(() => {
      expect(storage.persistConnectionConfig).toHaveBeenLastCalledWith({
        provider: 'github',
        organization: '',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      });
    });
  });

  test('useRepositorySourceConfig asigna repositoryId segun provider al seleccionar proyecto', async () => {
    storage.loadConnectionConfig.mockReturnValue({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });

    const { result } = renderHook(() => useRepositorySourceConfig({
      onConfigChangeStart: jest.fn(),
      onProjectSelected: jest.fn(),
    }));

    await act(async () => {
      result.current.selectProjectConfig('repo-a');
    });

    expect(result.current.config.project).toBe('repo-a');
    expect(result.current.config.repositoryId).toBe('repo-a');
    expect(result.current.configRef.current.repositoryId).toBe('repo-a');
  });

  test('useRepositorySourceConfig hidrata el secreto desde storage', async () => {
    storage.hydrateConnectionSecret.mockResolvedValue('pat-session');

    const { result } = renderHook(() => useRepositorySourceConfig({
      onConfigChangeStart: jest.fn(),
      onProjectSelected: jest.fn(),
    }));

    await expect(result.current.hydrateSecret()).resolves.toBe('pat-session');
  });

  test('useRepositorySourceBootstrap restaura PAT y refresca cuando el config minimo existe', async () => {
    const refreshPullRequests = jest.fn().mockResolvedValue(undefined);
    const updateConfig = jest.fn();
    const configRef = {
      current: {
        provider: 'github',
        organization: 'acme',
        project: '',
        repositoryId: '',
        personalAccessToken: '',
        targetReviewer: '',
      },
    };

    renderHook(() => useRepositorySourceBootstrap({
      configRef,
      hydrateSecret: jest.fn().mockResolvedValue('pat-restored'),
      updateConfig,
      refreshPullRequests,
    }));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith('personalAccessToken', 'pat-restored');
      expect(refreshPullRequests).toHaveBeenCalled();
      expect(configRef.current.personalAccessToken).toBe('pat-restored');
    });
  });

  test('useRepositorySourceBootstrap ignora errores de hidratacion y no refresca', async () => {
    const refreshPullRequests = jest.fn();
    const updateConfig = jest.fn();

    renderHook(() => useRepositorySourceBootstrap({
      configRef: {
        current: {
          provider: 'azure-devops',
          organization: 'org-a',
          project: 'project-a',
          repositoryId: '',
          personalAccessToken: '',
          targetReviewer: '',
        },
      },
      hydrateSecret: jest.fn().mockRejectedValue(new Error('boom')),
      updateConfig,
      refreshPullRequests,
    }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(updateConfig).not.toHaveBeenCalled();
    expect(refreshPullRequests).not.toHaveBeenCalled();
  });

  test('useRepositorySourceDerived calcula nombres seleccionados y readiness', () => {
    const { result } = renderHook(() => useRepositorySourceDerived({
      config: {
        provider: 'gitlab',
        organization: 'acme/platform',
        project: 'platform-api',
        repositoryId: 'platform-api',
        personalAccessToken: 'pat',
        targetReviewer: 'ian',
      },
      projects: [{ id: 'platform-api', name: 'Platform API', state: 'active' }],
      repositories: [{ id: 'platform-api', name: 'Platform API', webUrl: 'https://gitlab.com/acme/platform-api' }],
      pullRequests: [],
      lastUpdatedAt: new Date('2026-03-11T12:00:00.000Z'),
      hasSuccessfulConnection: true,
    }));

    expect(result.current.activeProviderName).toBe('GitLab');
    expect(result.current.hasCredentialsInSession).toBe(true);
    expect(result.current.isConnectionReady).toBe(true);
    expect(result.current.selectedProjectName).toBe('Platform API');
    expect(result.current.selectedRepositoryName).toBe('Platform API');
    expect(result.current.scopeLabel).toContain('acme/platform');
  });
});
