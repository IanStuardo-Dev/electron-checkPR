import React from 'react';
import type { RepositoryAnalysisRequest, RepositoryAnalysisResult } from '../../../../types/analysis';
import { cancelRepositoryAnalysis, runRepositoryAnalysis } from '../ipc';

type AnalysisPhase = 'idle' | 'preparing' | 'analyzing' | 'completed' | 'error' | 'cancelling';

export function useRepositoryAnalysis() {
  const [phase, setPhase] = React.useState<AnalysisPhase>('idle');
  const [result, setResult] = React.useState<RepositoryAnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const activeRequestIdRef = React.useRef<string | null>(null);

  const execute = React.useCallback(async (payload: RepositoryAnalysisRequest) => {
    setPhase('preparing');
    setError(null);
    setResult(null);
    activeRequestIdRef.current = payload.requestId;

    const timer = window.setTimeout(() => {
      setPhase('analyzing');
    }, 500);

    try {
      const nextResult = await runRepositoryAnalysis(payload);
      window.clearTimeout(timer);
      activeRequestIdRef.current = null;
      setResult(nextResult);
      setPhase('completed');
    } catch (nextError) {
      window.clearTimeout(timer);
      activeRequestIdRef.current = null;
      setError(nextError instanceof Error ? nextError.message : 'No fue posible ejecutar el analisis.');
      setPhase('error');
    }
  }, []);

  const cancel = React.useCallback(async () => {
    const requestId = activeRequestIdRef.current;
    if (!requestId) {
      return;
    }

    setPhase('cancelling');

    try {
      await cancelRepositoryAnalysis(requestId);
    } finally {
      activeRequestIdRef.current = null;
      setPhase('idle');
      setError(null);
      setResult(null);
    }
  }, []);

  const reset = React.useCallback(() => {
    activeRequestIdRef.current = null;
    setPhase('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    phase,
    result,
    error,
    isRunning: phase === 'preparing' || phase === 'analyzing' || phase === 'cancelling',
    isCancelling: phase === 'cancelling',
    execute,
    cancel,
    reset,
  };
}
