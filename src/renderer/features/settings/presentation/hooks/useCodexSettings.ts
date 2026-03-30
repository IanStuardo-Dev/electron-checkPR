import React from 'react';
import type { CodexIntegrationConfig } from '../../types';
import { hasCodexApiKeyInSession, loadCodexConfig, persistCodexConfig } from '../../data/settingsStorage';

export function useCodexSettings() {
  const [config, setConfig] = React.useState<CodexIntegrationConfig>(() => loadCodexConfig());
  const [hasPersistedApiKey, setHasPersistedApiKey] = React.useState(false);
  const [shouldSyncApiKey, setShouldSyncApiKey] = React.useState(false);

  React.useEffect(() => {
    void hasCodexApiKeyInSession()
      .then((hasKey) => {
        setHasPersistedApiKey(hasKey);
      })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    void persistCodexConfig(config, { syncApiKey: shouldSyncApiKey })
      .then(() => {
        if (!shouldSyncApiKey) {
          return;
        }

        const hasKey = Boolean(config.apiKey.trim());
        setHasPersistedApiKey(hasKey);
        setShouldSyncApiKey(false);
      })
      .catch(() => undefined);
  }, [config, shouldSyncApiKey]);

  const updateConfig = React.useCallback(<K extends keyof CodexIntegrationConfig>(
    key: K,
    value: CodexIntegrationConfig[K],
  ) => {
    if (key === 'apiKey') {
      setShouldSyncApiKey(true);
    }

    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const isReady = Boolean(config.enabled && (config.apiKey.trim() || hasPersistedApiKey));

  return {
    config,
    isReady,
    hasPersistedApiKey,
    updateConfig,
  };
}
