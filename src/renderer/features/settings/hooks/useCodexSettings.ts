import React from 'react';
import type { CodexIntegrationConfig } from '../../dashboard/types';
import { loadCodexConfig, persistCodexConfig } from '../storage';

export function useCodexSettings() {
  const [config, setConfig] = React.useState<CodexIntegrationConfig>(() => loadCodexConfig());

  React.useEffect(() => {
    persistCodexConfig(config);
  }, [config]);

  const updateConfig = React.useCallback(<K extends keyof CodexIntegrationConfig>(
    key: K,
    value: CodexIntegrationConfig[K],
  ) => {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const isReady = Boolean(config.enabled && config.apiKey.trim());

  return {
    config,
    isReady,
    updateConfig,
  };
}
