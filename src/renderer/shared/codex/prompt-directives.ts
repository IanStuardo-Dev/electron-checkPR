export interface ArchitecturePromptDirectivesLike {
  architectureReviewEnabled: boolean;
  architecturePattern: string;
  requiredPractices: string;
  forbiddenPractices: string;
  domainContext: string;
  customInstructions: string;
}

export function countActiveArchitectureDirectives(promptDirectives: ArchitecturePromptDirectivesLike): number {
  return [
    promptDirectives.architectureReviewEnabled,
    Boolean(promptDirectives.architecturePattern.trim()),
    Boolean(promptDirectives.requiredPractices.trim()),
    Boolean(promptDirectives.forbiddenPractices.trim()),
    Boolean(promptDirectives.domainContext.trim()),
    Boolean(promptDirectives.customInstructions.trim()),
  ].filter(Boolean).length;
}
