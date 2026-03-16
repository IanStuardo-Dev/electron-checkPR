import React from 'react';
import type { SavedConnectionConfig } from '../types';
import type { useRepositoryDiagnostics } from './useRepositoryDiagnostics';
import type { useRepositorySourceState } from './useRepositorySourceState';

interface UseRepositorySourceActionsOptions {
  state: ReturnType<typeof useRepositorySourceState>;
  diagnostics: ReturnType<typeof useRepositoryDiagnostics>;
}

export function useRepositorySourceActions({
  state,
  diagnostics,
}: UseRepositorySourceActionsOptions) {
  const resetForConfigChange = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    state.resetForConfigChange(name, value);
    diagnostics.resetDiagnosticsError();
  }, [diagnostics, state]);

  const openConnectionPanel = React.useCallback(() => {
    state.setIsConnectionPanelOpen(true);
  }, [state]);

  const selectProject = React.useCallback((project: string) => {
    state.markProjectSelection(project);
  }, [state]);

  return {
    resetForConfigChange,
    openConnectionPanel,
    selectProject,
  };
}
