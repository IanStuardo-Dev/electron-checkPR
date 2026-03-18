import type { CodexIntegrationConfig } from '../../types';
import { countConfiguredArchitectureDirectives } from '../../../../codex/architecturePromptDirectives';

export type CodexIntegrationChangeHandler = <K extends keyof CodexIntegrationConfig>(
  key: K,
  value: CodexIntegrationConfig[K],
) => void;

export function countConfiguredPolicies(config: CodexIntegrationConfig): number {
  const prDirectives = config.prReview.promptDirectives;

  return countConfiguredArchitectureDirectives(config.promptDirectives)
    + (prDirectives.focusAreas.trim() ? 1 : 0)
    + (prDirectives.customInstructions.trim() ? 1 : 0);
}
