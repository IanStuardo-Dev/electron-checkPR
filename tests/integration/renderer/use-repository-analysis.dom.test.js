const { renderHook, act } = require('@testing-library/react');

jest.useFakeTimers();

jest.mock('../../../src/renderer/features/repository-analysis/data/repositoryAnalysisBridge', () => ({
  previewRepositorySnapshot: jest.fn(),
  runRepositoryAnalysis: jest.fn(),
  cancelRepositoryAnalysis: jest.fn(),
}));

const bridge = require('../../../src/renderer/features/repository-analysis/data/repositoryAnalysisBridge');
const { useRepositoryAnalysis } = require('../../../src/renderer/features/repository-analysis/presentation/hooks/useRepositoryAnalysis');

describe('useRepositoryAnalysis', () => {
  beforeEach(() => {
    bridge.previewRepositorySnapshot.mockReset();
    bridge.runRepositoryAnalysis.mockReset();
    bridge.cancelRepositoryAnalysis.mockReset();
  });

  test('prepara preview del snapshot antes de ejecutar', async () => {
    bridge.previewRepositorySnapshot.mockResolvedValue({ repository: 'repo-a', branch: 'main' });
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      await result.current.preparePreview({ requestId: 'req-preview' });
    });

    expect(bridge.previewRepositorySnapshot).toHaveBeenCalledWith({ requestId: 'req-preview' });
    expect(result.current.preview).toEqual({ repository: 'repo-a', branch: 'main' });
    expect(result.current.phase).toBe('idle');
  });

  test('captura error de preview y lo refleja en el estado', async () => {
    bridge.previewRepositorySnapshot.mockRejectedValue(new Error('bridge unavailable'));
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      await result.current.preparePreview({ requestId: 'req-preview-error' });
    });

    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBe('bridge unavailable');
    expect(result.current.phase).toBe('error');
  });

  test('ejecuta analisis y completa resultado', async () => {
    bridge.runRepositoryAnalysis.mockResolvedValue({ summary: 'ok' });
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      const promise = result.current.execute({ requestId: 'req-1' });
      jest.advanceTimersByTime(600);
      await promise;
    });

    expect(result.current.phase).toBe('completed');
    expect(result.current.result).toEqual({ summary: 'ok' });
  });

  test('propaga un error controlado cuando falla el analisis', async () => {
    bridge.runRepositoryAnalysis.mockRejectedValue(new Error('analysis failed'));
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      await result.current.execute({ requestId: 'req-error' });
    });

    expect(result.current.phase).toBe('error');
    expect(result.current.error).toBe('analysis failed');
    expect(result.current.result).toBeNull();
  });

  test('cancela request activa y resetea el estado', async () => {
    bridge.runRepositoryAnalysis.mockImplementation(() => new Promise(() => {}));
    bridge.cancelRepositoryAnalysis.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRepositoryAnalysis());

    act(() => {
      result.current.execute({ requestId: 'req-2' });
    });

    await act(async () => {
      await result.current.cancel();
    });

    expect(bridge.cancelRepositoryAnalysis).toHaveBeenCalledWith('req-2');
    expect(result.current.phase).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  test('cancel limpia la transicion diferida a analyzing', async () => {
    bridge.runRepositoryAnalysis.mockImplementation(() => new Promise(() => {}));
    bridge.cancelRepositoryAnalysis.mockResolvedValue(undefined);
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

  test('reset limpia preview, resultado y error sin requerir una request activa', async () => {
    bridge.previewRepositorySnapshot.mockResolvedValue({ repository: 'repo-a', branch: 'main' });
    const { result } = renderHook(() => useRepositoryAnalysis());

    await act(async () => {
      await result.current.preparePreview({ requestId: 'req-preview-reset' });
    });

    expect(result.current.preview).toEqual({ repository: 'repo-a', branch: 'main' });

    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe('idle');
    expect(result.current.preview).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});


