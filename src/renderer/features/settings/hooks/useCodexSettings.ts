import React from 'react';
import type { CodexIntegrationConfig } from '../../dashboard/types';
import { hydrateCodexApiKey, loadCodexConfig, persistCodexConfig } from '../storage';

export function useCodexSettings() {
  const [config, setConfig] = React.useState<CodexIntegrationConfig>(() => loadCodexConfig());

  React.useEffect(() => {
    void hydrateCodexApiKey().then((apiKey) => {
      if (!apiKey) {
        return;
      }

      setConfig((current) => ({
        ...current,
        apiKey,
      }));
    }).catch(() => undefined);
  }, []);

  React.useEffect(() => {
    void persistCodexConfig(config);
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
