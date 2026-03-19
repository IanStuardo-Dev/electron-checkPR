const { resolveAnalysisServiceComposition } = require('../../../src/services/analysis/analysis-service.composition');

describe('analysis service composition', () => {
  test('usa defaults solo cuando faltan dependencias opcionales', () => {
    const snapshotProvider = { getSnapshot: jest.fn() };
    const promptBuilder = { build: jest.fn() };
    const defaults = {
      createPromptBuilder: jest.fn(() => ({ build: jest.fn() })),
      createAnalysisClient: jest.fn(() => ({ analyze: jest.fn() })),
      createResponseParser: jest.fn(() => ({ parse: jest.fn() })),
    };

    const composition = resolveAnalysisServiceComposition({
      snapshotProvider,
      promptBuilder,
    }, defaults);

    expect(composition.snapshotProvider).toBe(snapshotProvider);
    expect(composition.promptBuilder).toBe(promptBuilder);
    expect(defaults.createPromptBuilder).not.toHaveBeenCalled();
    expect(defaults.createAnalysisClient).toHaveBeenCalledTimes(1);
    expect(defaults.createResponseParser).toHaveBeenCalledTimes(1);
  });
});
