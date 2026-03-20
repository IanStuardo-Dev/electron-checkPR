const { RepositoryAnalysisRunStateManager } = require('../../../src/services/analysis/repository-analysis.run-state');

describe('RepositoryAnalysisRunStateManager', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('registerRun y cleanupRun administran el ciclo base de una corrida', () => {
    const manager = new RepositoryAnalysisRunStateManager();

    manager.registerRun('run-1');
    expect(manager.activeRuns.has('run-1')).toBe(true);

    manager.cleanupRun('run-1');
    expect(manager.activeRuns.has('run-1')).toBe(false);
  });

  test('createRemoteController asocia controller y aborta por timeout', async () => {
    jest.useFakeTimers();
    const manager = new RepositoryAnalysisRunStateManager();
    manager.registerRun('run-timeout');

    const controller = manager.createRemoteController('run-timeout', 250);
    expect(manager.activeRuns.get('run-timeout').controller).toBe(controller);
    expect(controller.signal.aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(250);

    expect(controller.signal.aborted).toBe(true);
    expect(controller.signal.reason).toBe('timeout');
  });

  test('cancelRun aborta y limpia cuando la corrida ya tiene controller activo', () => {
    const manager = new RepositoryAnalysisRunStateManager();
    manager.registerRun('run-cancel-active');
    const controller = manager.createRemoteController('run-cancel-active', 5000);
    const abortSpy = jest.spyOn(controller, 'abort');

    manager.cancelRun('run-cancel-active');

    expect(abortSpy).toHaveBeenCalledWith('cancelled');
    expect(manager.activeRuns.has('run-cancel-active')).toBe(false);
  });

  test('cancelRun antes de crear controller marca cancelado y assertNotCancelled falla', () => {
    const manager = new RepositoryAnalysisRunStateManager();
    manager.registerRun('run-cancelled-before-remote');

    manager.cancelRun('run-cancelled-before-remote');

    expect(() => manager.assertNotCancelled('run-cancelled-before-remote')).toThrow(
      'El analisis fue cancelado antes de iniciar la consulta remota.',
    );
    expect(manager.activeRuns.has('run-cancelled-before-remote')).toBe(false);
  });

  test('cancelRun ignora requestIds inexistentes', () => {
    const manager = new RepositoryAnalysisRunStateManager();
    expect(() => manager.cancelRun('missing-run')).not.toThrow();
  });
});
