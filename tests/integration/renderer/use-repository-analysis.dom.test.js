const { renderHook, act } = require('@testing-library/react');

jest.useFakeTimers();

jest.mock('../../../src/renderer/features/repository-analysis/ipc', () => ({
  runRepositoryAnalysis: jest.fn(),
  cancelRepositoryAnalysis: jest.fn(),
}));

const ipc = require('../../../src/renderer/features/repository-analysis/ipc');
const { useRepositoryAnalysis } = require('../../../src/renderer/features/repository-analysis/hooks/useRepositoryAnalysis');

describe('useRepositoryAnalysis', () => {
  beforeEach(() => {
    ipc.runRepositoryAnalysis.mockReset();
    ipc.cancelRepositoryAnalysis.mockReset();
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
});
