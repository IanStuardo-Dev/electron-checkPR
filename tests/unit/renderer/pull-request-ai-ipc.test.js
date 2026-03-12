const ipc = require('../../../src/renderer/features/dashboard/pullRequestAiIpc');

describe('pull request ai ipc', () => {
  beforeEach(() => {
    global.window = {
      electronApi: {
        invoke: jest.fn(),
      },
    };
  });

  test('preview usa el canal correcto', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: [{ pullRequestId: 1 }] });
    const payload = { items: [] };

    const result = await ipc.previewPullRequestAiReviews(payload);

    expect(window.electronApi.invoke).toHaveBeenCalledWith('analysis:previewPullRequestAiReviews', payload);
    expect(result).toEqual([{ pullRequestId: 1 }]);
  });

  test('run propaga error si main falla', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: false, error: 'quota' });
    await expect(ipc.runPullRequestAiReviews({ items: [] })).rejects.toThrow('quota');
  });

  test('cancel usa el canal correcto', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true });
    await expect(ipc.cancelPullRequestAiReviews('req-1')).resolves.toBeUndefined();
    expect(window.electronApi.invoke).toHaveBeenCalledWith('analysis:cancelPullRequestAiReviews', 'req-1');
  });
});
