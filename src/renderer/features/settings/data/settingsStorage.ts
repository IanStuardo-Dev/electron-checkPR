import type { CodexIntegrationConfig } from '../types';
import { CODEX_SESSION_API_KEY } from '../../../../constants/session-secrets';
import { loadStoredObject, saveStoredObject } from '../../../shared/storage/jsonStorage';
import { hasCodexSessionApiKey, setSessionSecret } from '../../../shared/storage/sessionSecrets';

const CODEX_SETTINGS_STORAGE_KEY = 'checkpr.settings.codex';

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
    previewConcurrency: 3,
    analysisConcurrency: 2,
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
  return {
    ...loadStoredObject<CodexIntegrationConfig>(window.localStorage, CODEX_SETTINGS_STORAGE_KEY, defaultCodexConfig),
    apiKey: '',
  };
}

export async function hasCodexApiKeyInSession(): Promise<boolean> {
  return hasCodexSessionApiKey();
}

export async function persistCodexConfig(
  config: CodexIntegrationConfig,
  options: { syncApiKey?: boolean } = {},
): Promise<void> {
  if (options.syncApiKey) {
    await setSessionSecret(CODEX_SESSION_API_KEY, config.apiKey);
  }
  const safeConfig: CodexIntegrationConfig = {
    ...config,
    apiKey: '',
  };

  saveStoredObject(window.localStorage, CODEX_SETTINGS_STORAGE_KEY, safeConfig);
}
