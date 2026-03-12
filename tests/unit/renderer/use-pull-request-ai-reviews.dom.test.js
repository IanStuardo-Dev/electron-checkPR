const React = require('react');
const { renderHook, act, waitFor } = require('@testing-library/react');

jest.mock('../../../src/renderer/features/dashboard/pullRequestAiIpc', () => ({
  runPullRequestAiReviews: jest.fn(),
}));

const { usePullRequestAiReviews } = require('../../../src/renderer/features/dashboard/hooks/usePullRequestAiReviews');
const { runPullRequestAiReviews } = require('../../../src/renderer/features/dashboard/pullRequestAiIpc');

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
    runPullRequestAiReviews.mockReset();
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

  test('usa debounce y cache para no re-ejecutar el analisis automatico sin cambios', async () => {
    const options = createOptions();
    const { rerender } = renderHook((props) => usePullRequestAiReviews(props), {
      initialProps: options,
    });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => expect(runPullRequestAiReviews).toHaveBeenCalledTimes(1));

    rerender({
      ...options,
      pullRequests: [createPullRequest(1)],
    });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(runPullRequestAiReviews).toHaveBeenCalledTimes(1);
  });
});
