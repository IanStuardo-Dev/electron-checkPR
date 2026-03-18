const { renderHook, act } = require('@testing-library/react');

jest.useFakeTimers();

jest.mock('../../../src/renderer/features/repository-analysis/data/repositoryAnalysisIpc', () => ({
  previewRepositorySnapshot: jest.fn(),
  runRepositoryAnalysis: jest.fn(),
  cancelRepositoryAnalysis: jest.fn(),
}));

const ipc = require('../../../src/renderer/features/repository-analysis/data/repositoryAnalysisIpc');
const { useRepositoryAnalysis } = require('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryAnalysis');

describe('useRepositoryAnalysis', () => {
  beforeEach(() => {
    ipc.previewRepositorySnapshot.mockReset();
    ipc.runRepositoryAnalysis.mockReset();
    ipc.cancelRepositoryAnalysis.mockReset();
  });

  test('prepara preview del snapshot antes de ejecutar', async () => {
    ipc.previewRepositorySnapshot.mockResolvedValue({ repository: 'repo-a', branch: 'main' });
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      await result.current.preparePreview({ requestId: 'req-preview' });
    });

    expect(ipc.previewRepositorySnapshot).toHaveBeenCalledWith({ requestId: 'req-preview' });
    expect(result.current.preview).toEqual({ repository: 'repo-a', branch: 'main' });
    expect(result.current.phase).toBe('idle');
  });

  test('captura error de preview y lo refleja en el estado', async () => {
    ipc.previewRepositorySnapshot.mockRejectedValue(new Error('bridge unavailable'));
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      await result.current.preparePreview({ requestId: 'req-preview-error' });
    });

    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBe('bridge unavailable');
    expect(result.current.phase).toBe('error');
  });

  test('ejecuta analisis y completa resultado', async () => {
    ipc.runRepositoryAnalysis.mockResolvedValue({ summary: 'ok' });
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      const promise = result.current.execute({ requestId: 'req-1' });
      jest.advanceTimersByTime(600);
      await promise;
    });

    expect(result.current.phase).toBe('completed');
    expect(result.current.result).toEqual({ summary: 'ok' });
  });

  test('cancela request activa y resetea el estado', async () => {
    ipc.runRepositoryAnalysis.mockImplementation(() => new Promise(() => {}));
    ipc.cancelRepositoryAnalysis.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRepositoryAnalysis());

    act(() => {
      result.current.execute({ requestId: 'req-2' });
    });

    await act(async () => {
      await result.current.cancel();
    });

    expect(ipc.cancelRepositoryAnalysis).toHaveBeenCalledWith('req-2');
    expect(result.current.phase).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  test('cancel limpia la transicion diferida a analyzing', async () => {
    ipc.runRepositoryAnalysis.mockImplementation(() => new Promise(() => {}));
    ipc.cancelRepositoryAnalysis.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRepositoryAnalysis());

    act(() => {
      result.current.execute({ requestId: 'req-3' });
    });

    await act(async () => {
      await result.current.cancel();
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.phase).toBe('idle');
    expect(result.current.isRunning).toBe(false);
  });
});
