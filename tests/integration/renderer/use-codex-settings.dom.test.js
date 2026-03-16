const React = require('react');
const { renderHook, act, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/settings/data/settingsStorage', () => ({
  loadCodexConfig: jest.fn(),
  persistCodexConfig: jest.fn().mockResolvedValue(undefined),
  hydrateCodexApiKey: jest.fn(),
}));

const storage = require('../../../src/renderer/features/settings/data/settingsStorage');
const { useCodexSettings } = require('../../../src/renderer/features/settings/presentation/hooks/useCodexSettings');

describe('useCodexSettings', () => {
  beforeEach(() => {
    storage.loadCodexConfig.mockReturnValue({
      enabled: false,
      model: 'gpt-5.2-codex',
      analysisDepth: 'standard',
      maxFilesPerRun: 80,
      includeTests: true,
      repositoryScope: 'selected',
      apiKey: '',
      snapshotPolicy: {
        excludedPathPatterns: '.env\nnode_modules/**',
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
    });
    storage.hydrateCodexApiKey.mockResolvedValue('sk-ready');
  });

  test('hidrata api key de sesion y calcula readiness', async () => {
    const { result } = renderHook(() => useCodexSettings());

    await waitFor(() => expect(result.current.config.apiKey).toBe('sk-ready'));
    expect(result.current.isReady).toBe(false);

    act(() => {
      result.current.updateConfig('enabled', true);
    });

    expect(result.current.isReady).toBe(true);
  });
});
