const React = require('react');
const { renderHook, act, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/dashboard/pullRequestAiIpc', () => ({
  previewPullRequestAiReviews: jest.fn(),
  runPullRequestAiReviews: jest.fn(),
  cancelPullRequestAiReviews: jest.fn(),
}));

const { usePullRequestAiReviews } = require('../../../src/renderer/features/dashboard/hooks/usePullRequestAiReviews');
const { previewPullRequestAiReviews } = require('../../../src/renderer/features/dashboard/pullRequestAiIpc');
const { runPullRequestAiReviews } = require('../../../src/renderer/features/dashboard/pullRequestAiIpc');
const { cancelPullRequestAiReviews } = require('../../../src/renderer/features/dashboard/pullRequestAiIpc');

function createPullRequest(id = 1) {
  return {
    id,
    title: `PR ${id}`,
    description: 'Cambio importante',
    repository: 'repo-a',
    url: `https://example.com/pr/${id}`,
    status: 'active',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T12:00:00.000Z',
    createdBy: { displayName: 'Ian' },
    sourceBranch: `feature/${id}`,
    targetBranch: 'main',
    mergeStatus: 'succeeded',
    isDraft: false,
    reviewers: [],
    ageHours: 12,
    riskScore: 5,
    approvals: 0,
    pendingReviewers: 1,
  };
}

function createOptions() {
  return {
    config: {
      provider: 'github',
      organization: 'acme',
      project: '',
      repositoryId: '',
      personalAccessToken: 'pat',
      targetReviewer: '',
    },
    pullRequests: [createPullRequest(1)],
    isConnectionReady: true,
    codexConfig: {
      apiKey: 'sk-live',
      model: 'gpt-5.2-codex',
      snapshotPolicy: {
        excludedPathPatterns: '',
        strictMode: false,
      },
      prReview: {
        enabled: true,
        maxPullRequests: 2,
        selectionMode: 'top-risk',
        analysisDepth: 'standard',
        promptDirectives: {
          focusAreas: '',
          customInstructions: '',
        },
      },
    },
  };
}

describe('usePullRequestAiReviews', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    previewPullRequestAiReviews.mockReset();
    runPullRequestAiReviews.mockReset();
    cancelPullRequestAiReviews.mockReset();
    previewPullRequestAiReviews.mockResolvedValue([
      {
        pullRequestId: 1,
        repository: 'repo-a',
        title: 'PR 1',
        filesPrepared: 1,
        totalFilesChanged: 1,
        includedFiles: ['src/auth.ts'],
        truncated: false,
        sensitivity: {
          findings: [],
          hasSensitiveConfigFiles: false,
          hasSecretPatterns: false,
          noSensitiveConfigFilesDetected: true,
          summary: 'Sin señales sensibles.',
        },
        disclaimer: 'Revisa este snapshot local antes de decidir si quieres enviarlo a Codex para analisis IA externo.',
        lacksPatchCoverage: false,
        strictModeWouldBlock: false,
      },
    ]);
    runPullRequestAiReviews.mockResolvedValue([
      {
        pullRequestId: 1,
        repository: 'repo-a',
        status: 'analyzed',
        riskScore: 77,
        shortSummary: 'Resumen',
        topConcerns: [],
        reviewChecklist: [],
      },
    ]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('no ejecuta analisis automatico y requiere preview manual antes del envio', async () => {
    const options = createOptions();
    const { result } = renderHook((props) => usePullRequestAiReviews(props), {
      initialProps: options,
    });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(runPullRequestAiReviews).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.openPriorityQueueReview();
    });

    await waitFor(() => expect(previewPullRequestAiReviews).toHaveBeenCalledTimes(1));
    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.setSnapshotAcknowledged(true);
    });

    await act(async () => {
      await result.current.runSelectedPullRequests();
    });

    expect(runPullRequestAiReviews).toHaveBeenCalledTimes(1);
    const payload = runPullRequestAiReviews.mock.calls[0][0];
    expect(payload.apiKey).toBe('');
    expect(payload.requestId).toEqual(expect.any(String));
    expect(payload.timeoutMs).toBe(60000);
  });
});
