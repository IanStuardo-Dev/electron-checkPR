import React from 'react';
import type { CodexIntegrationConfig } from '../../types';
import { hasCodexApiKeyInSession, loadCodexConfig, persistCodexConfig } from '../../data/settingsStorage';

interface ApiKeySaveFeedback {
  tone: 'success' | 'error';
  message: string;
}

export function useCodexSettings() {
  const [config, setConfig] = React.useState<CodexIntegrationConfig>(() => loadCodexConfig());
  const [hasPersistedApiKey, setHasPersistedApiKey] = React.useState(false);
  const [apiKeyNeedsSave, setApiKeyNeedsSave] = React.useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = React.useState(false);
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = React.useState<ApiKeySaveFeedback | null>(null);

  React.useEffect(() => {
    void hasCodexApiKeyInSession()
      .then((hasKey) => {
        setHasPersistedApiKey(hasKey);
      })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    void persistCodexConfig(config).catch(() => undefined);
  }, [config]);

  const updateConfig = React.useCallback(<K extends keyof CodexIntegrationConfig>(
    key: K,
    value: CodexIntegrationConfig[K],
  ) => {
    if (key === 'apiKey') {
      setApiKeyNeedsSave(true);
      setApiKeySaveFeedback(null);
    }

    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const saveApiKey = React.useCallback(async () => {
    setIsSavingApiKey(true);
    setApiKeySaveFeedback(null);

    try {
      const hasKey = Boolean(config.apiKey.trim());
      await persistCodexConfig(config, { syncApiKey: true });
      setHasPersistedApiKey(hasKey);
      setApiKeyNeedsSave(false);
      setApiKeySaveFeedback({
        tone: 'success',
        message: hasKey
          ? 'API key guardada en sesion.'
          : 'API key eliminada de la sesion.',
      });
    } catch (error) {
      setApiKeySaveFeedback({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : 'No fue posible guardar la API key de Codex.',
      });
    } finally {
      setIsSavingApiKey(false);
    }
  }, [config]);

  const isReady = Boolean(config.enabled && hasPersistedApiKey);

  return {
    config,
    isReady,
    hasPersistedApiKey,
    apiKeyNeedsSave,
    isSavingApiKey,
    apiKeySaveFeedback,
    updateConfig,
    saveApiKey,
  };
}
