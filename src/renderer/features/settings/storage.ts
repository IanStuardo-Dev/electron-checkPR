import type { CodexIntegrationConfig } from '../dashboard/types';

const CODEX_SETTINGS_STORAGE_KEY = 'checkpr.settings.codex';
const CODEX_SESSION_API_KEY = 'checkpr.settings.codex.api-key';

export const defaultCodexConfig: CodexIntegrationConfig = {
  enabled: false,
  model: 'gpt-5.2-codex',
  analysisDepth: 'standard',
  maxFilesPerRun: 80,
  includeTests: true,
  repositoryScope: 'selected',
  apiKey: '',
};

export function loadCodexConfig(): CodexIntegrationConfig {
  try {
    const saved = window.localStorage.getItem(CODEX_SETTINGS_STORAGE_KEY);
    const sessionApiKey = window.sessionStorage.getItem(CODEX_SESSION_API_KEY) || '';

    if (!saved) {
      return {
        ...defaultCodexConfig,
        apiKey: sessionApiKey,
      };
    }

    return {
      ...defaultCodexConfig,
      ...(JSON.parse(saved) as Partial<CodexIntegrationConfig>),
      apiKey: sessionApiKey,
    };
  } catch {
    return defaultCodexConfig;
  }
}

export function persistCodexConfig(config: CodexIntegrationConfig): void {
  if (config.apiKey) {
    window.sessionStorage.setItem(CODEX_SESSION_API_KEY, config.apiKey);
  } else {
    window.sessionStorage.removeItem(CODEX_SESSION_API_KEY);
  }

  const safeConfig: CodexIntegrationConfig = {
    ...config,
    apiKey: '',
  };

  window.localStorage.setItem(CODEX_SETTINGS_STORAGE_KEY, JSON.stringify(safeConfig));
}
