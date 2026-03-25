jest.mock('../../../src/modules/runtime-host/presentation/adapters/bridge-response', () => ({
  registerBridgeCommand: jest.fn(),
}));

const { registerBridgeCommand } = require('../../../src/modules/runtime-host/presentation/adapters/bridge-response');
const { SessionSecretsStore } = require('../../../src/modules/runtime-host/application/session-secrets/services/session-secrets-store.service');
const { bindSessionSecretsStoreBridge } = require('../../../src/modules/runtime-host/presentation/adapters/session-secrets-adapter');

describe('session secrets bridge', () => {
  beforeEach(() => {
    registerBridgeCommand.mockReset();
  });

  test('store guarda y elimina secretos', () => {
    const store = new SessionSecretsStore();
    store.set('key', 'value');
    expect(store.get('key')).toBe('value');
    expect(store.has('key')).toBe(true);
    store.set('key', '');
    expect(store.get('key')).toBe('');
    expect(store.has('key')).toBe(false);
  });

  test('bindSessionSecretsStoreBridge registra canales get/has/set', async () => {
    const store = new SessionSecretsStore();
    bindSessionSecretsStoreBridge(store);

    expect(registerBridgeCommand).toHaveBeenCalledTimes(3);
    const getHandler = registerBridgeCommand.mock.calls[0][1];
    const hasHandler = registerBridgeCommand.mock.calls[1][1];
    const setHandler = registerBridgeCommand.mock.calls[2][1];

    await expect(getHandler('key')).resolves.toBe('');
    await expect(hasHandler('key')).resolves.toBe(false);
    await expect(setHandler({ key: 'api-key', value: 'secret' })).resolves.toBeUndefined();
    await expect(getHandler('api-key')).resolves.toBe('secret');
    await expect(hasHandler('api-key')).resolves.toBe(true);
    await expect(setHandler({ key: '', value: 'x' })).rejects.toThrow('Secret key is required.');
  });
});








