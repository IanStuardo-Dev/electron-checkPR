import { CODEX_SESSION_API_KEY } from '../../../../../constants/session-secrets';
import type { AnalysisApiKeyReaderPort } from '../../../application/analysis/ports/analysis-api-key-reader.port';
import type { SessionSecretsStore } from '../../../application/session-secrets/services/session-secrets-store.service';

export function createSessionSecretsAnalysisApiKeyResolver(
  sessionSecretsStore: SessionSecretsStore,
): AnalysisApiKeyReaderPort {
  return {
    readCodexApiKey() {
      return sessionSecretsStore.get(CODEX_SESSION_API_KEY);
    },
  };
}

export const createAnalysisApiKeyResolver = createSessionSecretsAnalysisApiKeyResolver;

