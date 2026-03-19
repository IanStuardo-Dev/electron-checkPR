const { renderHook, act, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/repository-source/data/repositorySourceStorage', () => ({
  loadConnectionConfig: jest.fn(),
  persistConnectionConfig: jest.fn().mockResolvedValue(undefined),
  hydrateConnectionSecret: jest.fn(),
  migrateLegacyRepositorySourceStorage: jest.fn().mockResolvedValue(undefined),
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

    const { result } = renderHook(() => useRepositorySourceConfig());

    await act(async () => {
      result.current.updateConfig('provider', 'github');
    });

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

    const { result } = renderHook(() => useRepositorySourceConfig());

    await act(async () => {
      result.current.selectProjectConfig('repo-a');
    });

    expect(result.current.config.project).toBe('repo-a');
    expect(result.current.config.repositoryId).toBe('repo-a');
    expect(result.current.configRef.current.repositoryId).toBe('repo-a');
  });

  test('useRepositorySourceConfig resetea project y repositoryId al cambiar organization', async () => {
    storage.loadConnectionConfig.mockReturnValue({
      provider: 'azure-devops',
      organization: 'acme',
      project: 'platform',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    });

    const { result } = renderHook(() => useRepositorySourceConfig());

    await act(async () => {
      result.current.updateConfig('organization', 'other-org');
    });

    expect(result.current.config).toEqual({
      provider: 'azure-devops',
      organization: 'other-org',
      project: '',
      repositoryId: '',
      personalAccessToken: '',
      targetReviewer: '',
    });
  });

  test('useRepositorySourceConfig limpia solo repositoryId al cambiar project', async () => {
    storage.loadConnectionConfig.mockReturnValue({
      provider: 'azure-devops',
      organization: 'acme',
      project: 'platform',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    });

    const { result } = renderHook(() => useRepositorySourceConfig());

    await act(async () => {
      result.current.updateConfig('project', 'platform-v2');
    });

    expect(result.current.config.project).toBe('platform-v2');
    expect(result.current.config.repositoryId).toBe('');
  });

  test('useRepositorySourceConfig mantiene repositoryId vacio al seleccionar proyecto en azure', async () => {
    storage.loadConnectionConfig.mockReturnValue({
      provider: 'azure-devops',
      organization: 'acme',
      project: '',
      repositoryId: 'repo-a',
      personalAccessToken: '',
      targetReviewer: '',
    });

    const { result } = renderHook(() => useRepositorySourceConfig());

    await act(async () => {
      result.current.selectProjectConfig('platform');
    });

    expect(result.current.config.project).toBe('platform');
    expect(result.current.config.repositoryId).toBe('');
  });

  test('useRepositorySourceConfig hidrata el secreto desde storage', async () => {
    storage.hydrateConnectionSecret.mockResolvedValue('pat-session');

    const { result } = renderHook(() => useRepositorySourceConfig());

    await expect(result.current.hydrateSecret()).resolves.toBe('pat-session');
  });

  test('useRepositorySourceConfig aplica el secreto hidratado sin disparar resets de config', async () => {
    const { result } = renderHook(() => useRepositorySourceConfig());

    await act(async () => {
      result.current.applyHydratedSecret('pat-session');
    });

    expect(result.current.config.personalAccessToken).toBe('pat-session');
    expect(result.current.configRef.current.personalAccessToken).toBe('pat-session');
  });

  test('useRepositorySourceBootstrap restaura PAT y refresca cuando el config minimo existe', async () => {
    const refreshPullRequests = jest.fn().mockResolvedValue(undefined);
    const applyHydratedSecret = jest.fn((value) => ({
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: value,
      targetReviewer: '',
    }));

    renderHook(() => useRepositorySourceBootstrap({
      migrateLegacyStorage: jest.fn().mockResolvedValue(undefined),
      hydrateSecret: jest.fn().mockResolvedValue('pat-restored'),
      applyHydratedSecret,
      refreshPullRequests,
    }));

    await waitFor(() => {
      expect(applyHydratedSecret).toHaveBeenCalledWith('pat-restored');
      expect(refreshPullRequests).toHaveBeenCalled();
    });
  });

  test('useRepositorySourceBootstrap ignora errores de hidratacion y no refresca', async () => {
    const refreshPullRequests = jest.fn();
    const applyHydratedSecret = jest.fn();

    renderHook(() => useRepositorySourceBootstrap({
      migrateLegacyStorage: jest.fn().mockResolvedValue(undefined),
      hydrateSecret: jest.fn().mockRejectedValue(new Error('boom')),
      applyHydratedSecret,
      refreshPullRequests,
    }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(applyHydratedSecret).not.toHaveBeenCalled();
    expect(refreshPullRequests).not.toHaveBeenCalled();
  });

  test('useRepositorySourceBootstrap no actualiza ni refresca si el secreto no existe', async () => {
    const refreshPullRequests = jest.fn();
    const applyHydratedSecret = jest.fn();

    renderHook(() => useRepositorySourceBootstrap({
      migrateLegacyStorage: jest.fn().mockResolvedValue(undefined),
      hydrateSecret: jest.fn().mockResolvedValue(''),
      applyHydratedSecret,
      refreshPullRequests,
    }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(applyHydratedSecret).not.toHaveBeenCalled();
    expect(refreshPullRequests).not.toHaveBeenCalled();
  });

  test('useRepositorySourceBootstrap restaura secreto pero no refresca si falta config minima', async () => {
    const refreshPullRequests = jest.fn();
    const applyHydratedSecret = jest.fn((value) => ({
      provider: 'azure-devops',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: value,
      targetReviewer: '',
    }));

    renderHook(() => useRepositorySourceBootstrap({
      migrateLegacyStorage: jest.fn().mockResolvedValue(undefined),
      hydrateSecret: jest.fn().mockResolvedValue('pat-restored'),
      applyHydratedSecret,
      refreshPullRequests,
    }));

    await waitFor(() => {
      expect(applyHydratedSecret).toHaveBeenCalledWith('pat-restored');
    });

    expect(refreshPullRequests).not.toHaveBeenCalled();
  });

  test('useRepositorySourceBootstrap corre la migracion legacy antes de hidratar el secreto', async () => {
    const migrateLegacyStorage = jest.fn().mockResolvedValue(undefined);
    const hydrateSecret = jest.fn().mockResolvedValue('');

    renderHook(() => useRepositorySourceBootstrap({
      migrateLegacyStorage,
      hydrateSecret,
      applyHydratedSecret: jest.fn(),
      refreshPullRequests: jest.fn(),
    }));

    await waitFor(() => {
      expect(migrateLegacyStorage).toHaveBeenCalled();
      expect(hydrateSecret).toHaveBeenCalled();
    });

    expect(migrateLegacyStorage.mock.invocationCallOrder[0]).toBeLessThan(hydrateSecret.mock.invocationCallOrder[0]);
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

    expect(result.current.hasCredentialsInSession).toBe(true);
    expect(result.current.isConnectionReady).toBe(true);
    expect(result.current.selectedProjectName).toBe('Platform API');
    expect(result.current.selectedRepositoryName).toBe('Platform API');
    expect(result.current.scopeLabel).toContain('acme/platform');
  });

  test('useRepositorySourceDerived usa fallbacks cuando no hay provider o match seleccionado', () => {
    const { result } = renderHook(() => useRepositorySourceDerived({
      config: {
        provider: '',
        organization: '',
        project: 'manual-project',
        repositoryId: 'manual-repo',
        personalAccessToken: '',
        targetReviewer: '',
      },
      projects: [],
      repositories: [],
      pullRequests: [],
      lastUpdatedAt: null,
      hasSuccessfulConnection: false,
    }));

    expect(result.current.hasCredentialsInSession).toBe(false);
    expect(result.current.isConnectionReady).toBe(false);
    expect(result.current.selectedProjectName).toBe('manual-project');
    expect(result.current.selectedRepositoryName).toBe('manual-repo');
    expect(result.current.scopeLabel).toBe('Selecciona un provider en Settings');
  });
});
