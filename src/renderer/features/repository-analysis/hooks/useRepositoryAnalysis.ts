import React from 'react';
import type { RepositoryAnalysisRequest, RepositoryAnalysisResult } from '../../../../types/analysis';
import { runRepositoryAnalysis } from '../ipc';

type AnalysisPhase = 'idle' | 'preparing' | 'analyzing' | 'completed' | 'error';

export function useRepositoryAnalysis() {
  const [phase, setPhase] = React.useState<AnalysisPhase>('idle');
  const [result, setResult] = React.useState<RepositoryAnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const execute = React.useCallback(async (payload: RepositoryAnalysisRequest) => {
    setPhase('preparing');
    setError(null);
    setResult(null);

    const timer = window.setTimeout(() => {
      setPhase('analyzing');
    }, 500);

    try {
      const nextResult = await runRepositoryAnalysis(payload);
      window.clearTimeout(timer);
      setResult(nextResult);
      setPhase('completed');
    } catch (nextError) {
      window.clearTimeout(timer);
      setError(nextError instanceof Error ? nextError.message : 'No fue posible ejecutar el analisis.');
      setPhase('error');
    }
  }, []);

  const reset = React.useCallback(() => {
    setPhase('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    phase,
    result,
    error,
    isRunning: phase === 'preparing' || phase === 'analyzing',
    execute,
    reset,
  };
}
