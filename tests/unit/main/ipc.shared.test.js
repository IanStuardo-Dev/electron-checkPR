jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

const { ipcMain } = require('electron');
const { registerHandle, safeIpcResponse } = require('../../../src/main/ipc/shared');

describe('main ipc shared', () => {
  beforeEach(() => {
    ipcMain.handle.mockReset();
  });

  test('safeIpcResponse envuelve errores', async () => {
    await expect(safeIpcResponse(async () => 'ok')).resolves.toEqual({ ok: true, data: 'ok' });
    await expect(safeIpcResponse(async () => { throw new Error('boom'); })).resolves.toEqual({ ok: false, error: 'boom' });
    await expect(safeIpcResponse(async () => { throw 'boom'; })).resolves.toEqual({ ok: false, error: 'Unknown IPC error.' });
  });

  test('registerHandle registra handler seguro', async () => {
    registerHandle('demo:channel', async (payload) => `${payload.value}-done`);

    const handler = ipcMain.handle.mock.calls[0][1];
    await expect(handler(null, { value: 'work' })).resolves.toEqual({ ok: true, data: 'work-done' });
  });
});
