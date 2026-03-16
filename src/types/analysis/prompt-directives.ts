export interface RepositoryAnalysisPromptDirectives {
  architectureReviewEnabled: boolean;
  architecturePattern: string;
  requiredPractices: string;
  forbiddenPractices: string;
  domainContext: string;
  customInstructions: string;
}

export interface PullRequestAnalysisPromptDirectives {
  focusAreas: string;
  customInstructions: string;
}
