const React = require('react');
const { renderHook, act, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/settings/data/settingsStorage', () => ({
  loadCodexConfig: jest.fn(),
  persistCodexConfig: jest.fn().mockResolvedValue(undefined),
  hasCodexApiKeyInSession: jest.fn(),
}));

const storage = require('../../../src/renderer/features/settings/data/settingsStorage');
const { useCodexSettings } = require('../../../src/renderer/features/settings/presentation/hooks/useCodexSettings');

describe('useCodexSettings', () => {
  beforeEach(() => {
    storage.persistCodexConfig.mockClear();
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
    storage.hasCodexApiKeyInSession.mockResolvedValue(true);
  });

  test('hidrata presencia de api key de sesion y calcula readiness', async () => {
    const { result } = renderHook(() => useCodexSettings());

    await waitFor(() => expect(result.current.hasPersistedApiKey).toBe(true));
    expect(result.current.isReady).toBe(false);

    act(() => {
      result.current.updateConfig('enabled', true);
    });

    expect(result.current.isReady).toBe(true);
  });

  test('api key requiere guardado explicito para sincronizar sesion', async () => {
    const { result } = renderHook(() => useCodexSettings());

    await waitFor(() => expect(result.current.hasPersistedApiKey).toBe(true));
    storage.persistCodexConfig.mockClear();

    act(() => {
      result.current.updateConfig('apiKey', 'sk-secret');
    });

    await waitFor(() => expect(storage.persistCodexConfig).toHaveBeenCalled());
    expect(
      storage.persistCodexConfig.mock.calls.some(([, options]) => options && options.syncApiKey === true),
    ).toBe(false);
    expect(result.current.apiKeyNeedsSave).toBe(true);

    await act(async () => {
      await result.current.saveApiKey();
    });

    expect(storage.persistCodexConfig).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-secret' }),
      { syncApiKey: true },
    );
    expect(result.current.apiKeyNeedsSave).toBe(false);
    expect(result.current.apiKeySaveFeedback).toEqual({
      tone: 'success',
      message: 'API key guardada en sesion.',
    });
  });
});
