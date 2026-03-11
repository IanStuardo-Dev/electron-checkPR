jest.mock('../../../src/main/ipc/shared', () => ({
  registerHandle: jest.fn(),
}));

const { registerHandle } = require('../../../src/main/ipc/shared');
const { SessionSecretsStore, registerSessionSecretsIpc } = require('../../../src/main/ipc/session-secrets');

describe('session secrets ipc', () => {
  beforeEach(() => {
    registerHandle.mockReset();
  });

  test('store guarda y elimina secretos', () => {
    const store = new SessionSecretsStore();
    store.set('key', 'value');
    expect(store.get('key')).toBe('value');
    store.set('key', '');
    expect(store.get('key')).toBe('');
  });

  test('registerSessionSecretsIpc registra canales get/set', async () => {
    const store = new SessionSecretsStore();
    registerSessionSecretsIpc(store);

    expect(registerHandle).toHaveBeenCalledTimes(2);
    const setHandler = registerHandle.mock.calls[1][1];
    await expect(setHandler({ key: '', value: 'x' })).rejects.toThrow('Secret key is required.');
  });
});
