import type { CodexIntegrationConfig } from '../dashboard/types';
import { CODEX_SESSION_API_KEY } from '../../../constants/session-secrets';

const CODEX_SETTINGS_STORAGE_KEY = 'checkpr.settings.codex';

async function getSessionSecret(key: string): Promise<string> {
  const response = await window.electronApi.invoke('session-secrets:get', key) as { ok: boolean; data?: string; error?: string };
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible leer el secreto de sesion.');
  }

  return response.data || '';
}

async function setSessionSecret(key: string, value: string): Promise<void> {
  const response = await window.electronApi.invoke('session-secrets:set', { key, value }) as { ok: boolean; error?: string };
  if (!response.ok) {
    throw new Error(response.error || 'No fue posible persistir el secreto de sesion.');
  }
}

export const defaultCodexConfig: CodexIntegrationConfig = {
  enabled: false,
  model: 'gpt-5.2-codex',
  analysisDepth: 'standard',
  maxFilesPerRun: 80,
  includeTests: true,
  repositoryScope: 'selected',
  apiKey: '',
  snapshotPolicy: {
    excludedPathPatterns: [
      '.env',
      '.env.*',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.pem',
      '*.key',
      '*.p12',
      'terraform.tfvars',
    ].join('\n'),
    strictMode: false,
  },
  prReview: {
    enabled: false,
    maxPullRequests: 4,
    selectionMode: 'top-risk',
    analysisDepth: 'standard',
    promptDirectives: {
      focusAreas: '',
      customInstructions: '',
    },
  },
  promptDirectives: {
    architectureReviewEnabled: false,
    architecturePattern: '',
    requiredPractices: '',
    forbiddenPractices: '',
    domainContext: '',
    customInstructions: '',
  },
};

export function loadCodexConfig(): CodexIntegrationConfig {
  try {
    const saved = window.localStorage.getItem(CODEX_SETTINGS_STORAGE_KEY);

    if (!saved) {
      return {
        ...defaultCodexConfig,
        apiKey: '',
      };
    }

    return {
      ...defaultCodexConfig,
      ...(JSON.parse(saved) as Partial<CodexIntegrationConfig>),
      apiKey: '',
    };
  } catch {
    return defaultCodexConfig;
  }
}

export async function hydrateCodexApiKey(): Promise<string> {
  return getSessionSecret(CODEX_SESSION_API_KEY);
}

export async function persistCodexConfig(config: CodexIntegrationConfig): Promise<void> {
  await setSessionSecret(CODEX_SESSION_API_KEY, config.apiKey);
  const safeConfig: CodexIntegrationConfig = {
    ...config,
    apiKey: '',
  };

  window.localStorage.setItem(CODEX_SETTINGS_STORAGE_KEY, JSON.stringify(safeConfig));
}
