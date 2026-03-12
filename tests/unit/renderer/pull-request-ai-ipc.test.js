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

  test('preview propaga errores de main', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: false, error: 'preview failed' });
    await expect(ipc.previewPullRequestAiReviews({ items: [] })).rejects.toThrow('preview failed');
  });

  test('run propaga error si main falla', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: false, error: 'quota' });
    await expect(ipc.runPullRequestAiReviews({ items: [] })).rejects.toThrow('quota');
  });

  test('run devuelve reviews cuando main responde ok', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true, data: [{ pullRequestId: 1, status: 'analyzed' }] });
    await expect(ipc.runPullRequestAiReviews({ items: [] })).resolves.toEqual([{ pullRequestId: 1, status: 'analyzed' }]);
  });

  test('cancel usa el canal correcto', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: true });
    await expect(ipc.cancelPullRequestAiReviews('req-1')).resolves.toBeUndefined();
    expect(window.electronApi.invoke).toHaveBeenCalledWith('analysis:cancelPullRequestAiReviews', 'req-1');
  });

  test('cancel propaga error si no puede abortar', async () => {
    window.electronApi.invoke.mockResolvedValue({ ok: false, error: 'cancel failed' });
    await expect(ipc.cancelPullRequestAiReviews('req-2')).rejects.toThrow('cancel failed');
  });
});
