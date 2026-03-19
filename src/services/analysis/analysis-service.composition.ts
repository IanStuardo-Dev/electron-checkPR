export interface AnalysisServiceCompositionInput<
  TSnapshotProvider,
  TPromptBuilder,
  TAnalysisClient,
  TResponseParser,
> {
  snapshotProvider: TSnapshotProvider;
  promptBuilder?: TPromptBuilder;
  analysisClient?: TAnalysisClient;
  responseParser?: TResponseParser;
}

export function resolveAnalysisServiceComposition<
  TSnapshotProvider,
  TPromptBuilder,
  TAnalysisClient,
  TResponseParser,
>(
  input: AnalysisServiceCompositionInput<TSnapshotProvider, TPromptBuilder, TAnalysisClient, TResponseParser>,
  defaults: {
    createPromptBuilder: () => TPromptBuilder;
    createAnalysisClient: () => TAnalysisClient;
    createResponseParser: () => TResponseParser;
  },
) {
  return {
    snapshotProvider: input.snapshotProvider,
    promptBuilder: input.promptBuilder ?? defaults.createPromptBuilder(),
    analysisClient: input.analysisClient ?? defaults.createAnalysisClient(),
    responseParser: input.responseParser ?? defaults.createResponseParser(),
  };
}
