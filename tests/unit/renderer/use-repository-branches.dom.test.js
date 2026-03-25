const { renderHook, waitFor, act } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/repository-source/data/repositorySourceBridge', () => ({
  fetchBranches: jest.fn(),
}));

const { fetchBranches } = require('../../../src/renderer/features/repository-source/data/repositorySourceBridge');
const { useRepositoryBranches } = require('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryBranches');

function createConfig(overrides = {}) {
  return {
    provider: 'github',
    organization: 'acme',
    project: 'repo-a',
    repositoryId: 'repo-a',
    personalAccessToken: 'pat',
    targetReviewer: '',
    ...overrides,
  };
}

describe('useRepositoryBranches', () => {
  beforeEach(() => {
    fetchBranches.mockReset();
    fetchBranches.mockResolvedValue([]);
  });

  test('si falta config minima limpia las ramas y no consulta', async () => {
    const { result, rerender } = renderHook((props) => useRepositoryBranches(props), {
      initialProps: {
        config: createConfig({ provider: '' }),
        isConnectionReady: false,
        repositoryId: '',
      },
    });

    expect(result.current.branches).toEqual([]);
    expect(result.current.branchName).toBe('');
    expect(fetchBranches).not.toHaveBeenCalled();

    fetchBranches.mockResolvedValue([]);
    rerender({
      config: createConfig(),
      isConnectionReady: true,
      repositoryId: 'repo-a',
    });

    await waitFor(() => expect(fetchBranches).toHaveBeenCalled());
  });

  test('carga ramas y selecciona la default cuando existe', async () => {
    const config = createConfig();
    fetchBranches.mockResolvedValue([
      { name: 'develop', objectId: '1', isDefault: false },
      { name: 'main', objectId: '2', isDefault: true },
    ]);

    const { result } = renderHook(() => useRepositoryBranches({
      config,
      isConnectionReady: true,
      repositoryId: 'repo-a',
    }));

    expect(result.current.isLoadingBranches).toBe(true);
    await waitFor(() => expect(result.current.branchName).toBe('main'));

    expect(fetchBranches).toHaveBeenCalledWith(expect.objectContaining({
      repositoryId: 'repo-a',
      project: 'repo-a',
    }));
    expect(result.current.branches).toHaveLength(2);
    expect(result.current.branchName).toBe('main');
    expect(result.current.branchError).toBeNull();
  });

  test('si no hay default selecciona la primera rama disponible', async () => {
    const config = createConfig();
    fetchBranches.mockResolvedValue([
      { name: 'release', objectId: '1', isDefault: false },
      { name: 'develop', objectId: '2', isDefault: false },
    ]);

    const { result } = renderHook(() => useRepositoryBranches({
      config,
      isConnectionReady: true,
      repositoryId: 'repo-a',
    }));

    await waitFor(() => expect(result.current.branchName).toBe('release'));

    expect(result.current.branchName).toBe('release');
  });

  test('si no hay ramas disponibles deja el branchName vacio', async () => {
    const config = createConfig();
    fetchBranches.mockResolvedValue([]);

    const { result } = renderHook(() => useRepositoryBranches({
      config,
      isConnectionReady: true,
      repositoryId: 'repo-a',
    }));

    await waitFor(() => expect(result.current.isLoadingBranches).toBe(false));
    expect(result.current.branches).toEqual([]);
    expect(result.current.branchName).toBe('');
  });

  test('si fetchBranches falla, limpia el estado y expone el error', async () => {
    const config = createConfig();
    let rejectRequest;
    fetchBranches.mockImplementation(() => new Promise((_, reject) => {
      rejectRequest = reject;
    }));

    const { result } = renderHook(() => useRepositoryBranches({
      config,
      isConnectionReady: true,
      repositoryId: 'repo-a',
    }));

    await waitFor(() => expect(fetchBranches).toHaveBeenCalled());

    await act(async () => {
      rejectRequest(new Error('provider unavailable'));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.branchError).toBe('provider unavailable'));
    expect(result.current.branches).toEqual([]);
    expect(result.current.branchName).toBe('');
    expect(result.current.isLoadingBranches).toBe(false);
  });

  test('si fetchBranches falla con un valor no tipado usa el mensaje fallback', async () => {
    const config = createConfig();
    fetchBranches.mockRejectedValue('boom');

    const { result } = renderHook(() => useRepositoryBranches({
      config,
      isConnectionReady: true,
      repositoryId: 'repo-a',
    }));

    await waitFor(() => expect(result.current.branchError).toBe('No fue posible cargar las ramas.'));
    expect(result.current.isLoadingBranches).toBe(false);
  });

  test('ignora respuestas tardias cuando el hook se desmonta', async () => {
    const config = createConfig();
    let resolveRequest;
    fetchBranches.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const { result, unmount } = renderHook(() => useRepositoryBranches({
      config,
      isConnectionReady: true,
      repositoryId: 'repo-a',
    }));

    expect(result.current.isLoadingBranches).toBe(true);
    unmount();

    await act(async () => {
      resolveRequest([{ name: 'main', objectId: '1', isDefault: true }]);
      await Promise.resolve();
    });

    expect(fetchBranches).toHaveBeenCalled();
  });
});

