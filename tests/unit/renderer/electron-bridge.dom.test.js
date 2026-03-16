const {
  getElectronApi,
  hasElectronApi,
  invokeElectronApi,
  subscribeToWindowStateChange,
  getElectronBridgeUnavailableMessage,
} = require('../../../src/renderer/shared/electron/electronBridge');

describe('electron bridge helpers', () => {
  beforeEach(() => {
    window.electronApi = {
      invoke: jest.fn().mockResolvedValue('ok'),
      onWindowStateChange: jest.fn(() => jest.fn()),
    };
  });

  test('getElectronApi y hasElectronApi detectan el bridge disponible', () => {
    expect(getElectronApi()).toBe(window.electronApi);
    expect(hasElectronApi()).toBe(true);
  });

  test('invokeElectronApi usa invoke del bridge', async () => {
    await expect(invokeElectronApi('demo:channel', { work: true })).resolves.toBe('ok');

    expect(window.electronApi.invoke).toHaveBeenCalledWith('demo:channel', { work: true });
  });

  test('subscribeToWindowStateChange delega al bridge cuando existe', () => {
    const listener = jest.fn();
    const unsubscribe = jest.fn();
    window.electronApi.onWindowStateChange.mockReturnValue(unsubscribe);

    const returned = subscribeToWindowStateChange(listener);

    expect(window.electronApi.onWindowStateChange).toHaveBeenCalledWith(listener);
    expect(returned).toBe(unsubscribe);
  });

  test('si el bridge no existe entrega un error claro y un unsubscribe seguro', async () => {
    delete window.electronApi;

    expect(getElectronApi()).toBeNull();
    expect(hasElectronApi()).toBe(false);
    expect(subscribeToWindowStateChange(jest.fn())()).toBeUndefined();
    await expect(invokeElectronApi('demo:channel')).rejects.toThrow(
      'No se detecto el bridge de Electron. Esta app requiere ejecutarse dentro de Electron.',
    );
    expect(getElectronBridgeUnavailableMessage()).toContain('Esta app requiere ejecutarse dentro de Electron');
  });

  test('ignora objetos incompletos que no son un bridge valido', () => {
    window.electronApi = {
      onWindowStateChange: jest.fn(),
    };

    expect(getElectronApi()).toBeNull();
    expect(hasElectronApi()).toBe(false);
  });
});
