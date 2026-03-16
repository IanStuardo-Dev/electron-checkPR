import React from 'react';
import type { SavedConnectionConfig } from '../../types';

interface RepositorySourceConfigHandlers {
  onConfigChangeStart: (name: keyof SavedConnectionConfig, value: string) => void;
  onProjectSelected: (project: string) => void;
}

export function useRepositorySourceFacade(
  handlers: {
    resetForConfigChange: (name: keyof SavedConnectionConfig, value: string) => void;
    selectProject: (project: string) => void;
  },
) {
  const configHandlersRef = React.useRef<RepositorySourceConfigHandlers | null>(null);

  configHandlersRef.current = {
    onConfigChangeStart: handlers.resetForConfigChange,
    onProjectSelected: handlers.selectProject,
  };

  return configHandlersRef;
}

