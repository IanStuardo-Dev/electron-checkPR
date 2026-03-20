export interface RepositoryAnalysisActiveRun {
  cancelled: boolean;
  controller: AbortController | null;
  timeoutId: NodeJS.Timeout | null;
}

const CANCELLED_BEFORE_REMOTE_ERROR = 'El analisis fue cancelado antes de iniciar la consulta remota.';

export class RepositoryAnalysisRunStateManager {
  readonly activeRuns = new Map<string, RepositoryAnalysisActiveRun>();

  registerRun(requestId: string): void {
    this.activeRuns.set(requestId, {
      cancelled: false,
      controller: null,
      timeoutId: null,
    });
  }

  createRemoteController(requestId: string, timeoutMs: number): AbortController {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
    const activeRun = this.activeRuns.get(requestId);

    if (activeRun) {
      activeRun.controller = controller;
      activeRun.timeoutId = timeoutId;
    }

    return controller;
  }

  cancelRun(requestId: string): void {
    const activeRun = this.activeRuns.get(requestId);
    if (!activeRun) {
      return;
    }

    activeRun.cancelled = true;
    if (activeRun.controller) {
      activeRun.controller.abort('cancelled');
      this.cleanupRun(requestId);
    }
  }

  assertNotCancelled(requestId: string): void {
    if (this.activeRuns.get(requestId)?.cancelled) {
      this.cleanupRun(requestId);
      throw new Error(CANCELLED_BEFORE_REMOTE_ERROR);
    }
  }

  cleanupRun(requestId: string): void {
    const activeRun = this.activeRuns.get(requestId);
    if (!activeRun) {
      return;
    }

    if (activeRun.timeoutId) {
      clearTimeout(activeRun.timeoutId);
    }

    this.activeRuns.delete(requestId);
  }
}
