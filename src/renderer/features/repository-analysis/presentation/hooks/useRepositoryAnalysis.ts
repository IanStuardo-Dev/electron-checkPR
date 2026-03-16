import React from 'react';
import type { RepositoryAnalysisRequest, RepositoryAnalysisResult, RepositorySnapshotPreview } from '../../../../../types/analysis';
import { cancelRepositoryAnalysis, previewRepositorySnapshot, runRepositoryAnalysis } from '../../data/repositoryAnalysisIpc';

type AnalysisPhase = 'idle' | 'previewing' | 'preparing' | 'analyzing' | 'completed' | 'error' | 'cancelling';

export function useRepositoryAnalysis() {
  const [phase, setPhase] = React.useState<AnalysisPhase>('idle');
  const [result, setResult] = React.useState<RepositoryAnalysisResult | null>(null);
  const [preview, setPreview] = React.useState<RepositorySnapshotPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const activeRequestIdRef = React.useRef<string | null>(null);

  const preparePreview = React.useCallback(async (payload: RepositoryAnalysisRequest) => {
    setPhase('previewing');
    setError(null);
    setResult(null);

    try {
      const nextPreview = await previewRepositorySnapshot(payload);
      setPreview(nextPreview);
      setPhase('idle');
    } catch (nextError) {
      setPreview(null);
      setError(nextError instanceof Error ? nextError.message : 'No fue posible preparar el snapshot del repositorio.');
      setPhase('error');
    }
  }, []);

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
      setPreview(null);
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
      setPreview(null);
    }
  }, []);

  const reset = React.useCallback(() => {
    activeRequestIdRef.current = null;
    setPhase('idle');
    setPreview(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    phase,
    preview,
    result,
    error,
    isPreviewing: phase === 'previewing',
    isRunning: phase === 'preparing' || phase === 'analyzing' || phase === 'cancelling',
    isCancelling: phase === 'cancelling',
    preparePreview,
    execute,
    cancel,
    reset,
  };
}
