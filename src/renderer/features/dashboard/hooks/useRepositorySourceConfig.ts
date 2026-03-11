import React from 'react';
import {
  hydrateConnectionSecret,
  loadConnectionConfig,
  persistConnectionConfig,
} from '../storage';
import type { SavedConnectionConfig } from '../types';

interface UseRepositorySourceConfigResult {
  config: SavedConnectionConfig;
  configRef: React.MutableRefObject<SavedConnectionConfig>;
  updateConfig: (name: keyof SavedConnectionConfig, value: string) => void;
  selectProjectConfig: (project: string) => void;
  hydrateSecret: () => Promise<string>;
}

export function useRepositorySourceConfig(
  handlers: {
    onConfigChangeStart: (name: keyof SavedConnectionConfig, value: string) => void;
    onConfigChanged: (nextConfig: SavedConnectionConfig, name: keyof SavedConnectionConfig, value: string) => void;
    onProjectSelected: (project: string) => void;
  },
): UseRepositorySourceConfigResult {
  const initialConfig = React.useMemo(() => loadConnectionConfig(), []);
  const [config, setConfig] = React.useState<SavedConnectionConfig>(initialConfig);
  const configRef = React.useRef<SavedConnectionConfig>(initialConfig);

  React.useEffect(() => {
    configRef.current = config;
    void persistConnectionConfig(config);
  }, [config]);

  const updateConfig = React.useCallback((name: keyof SavedConnectionConfig, value: string) => {
    handlers.onConfigChangeStart(name, value);

    setConfig((current) => {
      const nextConfig = {
        ...current,
        ...(name === 'provider'
          ? {
            organization: '',
            project: '',
            repositoryId: '',
            personalAccessToken: '',
            targetReviewer: '',
          }
          : {}),
        ...(name === 'organization'
          ? { project: '', repositoryId: '' }
          : {}),
        ...(name === 'project'
          ? { repositoryId: '' }
          : {}),
        [name]: value,
      };

      configRef.current = nextConfig;
      handlers.onConfigChanged(nextConfig, name, value);
      return nextConfig;
    });
  }, [handlers]);

  const selectProjectConfig = React.useCallback((project: string) => {
    handlers.onProjectSelected(project);

    setConfig((current) => {
      const nextConfig = current.provider === 'github' || current.provider === 'gitlab'
        ? {
          ...current,
          project,
          repositoryId: project,
        }
        : {
          ...current,
          project,
          repositoryId: '',
        };

      configRef.current = nextConfig;
      return nextConfig;
    });
  }, [handlers]);

  const hydrateSecret = React.useCallback(() => hydrateConnectionSecret(), []);

  return {
    config,
    configRef,
    updateConfig,
    selectProjectConfig,
    hydrateSecret,
  };
}
