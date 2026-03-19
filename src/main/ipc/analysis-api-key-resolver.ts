import { CODEX_SESSION_API_KEY } from '../../constants/session-secrets';
import type { SessionSecretsStore } from './session-secrets';

export interface AnalysisApiKeyResolverPort {
  readCodexApiKey(): string;
}

export function createAnalysisApiKeyResolver(
  sessionSecretsStore: SessionSecretsStore,
): AnalysisApiKeyResolverPort {
  return {
    readCodexApiKey() {
      return sessionSecretsStore.get(CODEX_SESSION_API_KEY);
    },
  };
}
