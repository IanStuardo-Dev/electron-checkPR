jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

const { ipcMain } = require('electron');
const { registerBridgeCommand, safeBridgeResponse } = require('../../../src/modules/runtime-host/presentation/adapters/bridge-response');

describe('main bridge shared', () => {
  beforeEach(() => {
    ipcMain.handle.mockReset();
  });

  test('safeBridgeResponse envuelve errores', async () => {
    await expect(safeBridgeResponse(async () => 'ok')).resolves.toEqual({ ok: true, data: 'ok' });
    await expect(safeBridgeResponse(async () => { throw new Error('boom'); })).resolves.toEqual({ ok: false, error: 'boom' });
    await expect(safeBridgeResponse(async () => { throw 'boom'; })).resolves.toEqual({ ok: false, error: 'Unknown transport error.' });
  });

  test('registerBridgeCommand registra handler seguro', async () => {
    registerBridgeCommand('demo:channel', async (payload) => `${payload.value}-done`);

    const handler = ipcMain.handle.mock.calls[0][1];
    await expect(handler(null, { value: 'work' })).resolves.toEqual({ ok: true, data: 'work-done' });
  });
});








