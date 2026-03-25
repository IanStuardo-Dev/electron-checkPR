const registeredHandlers = {};

const ipcMain = {
  handle: jest.fn((channel, handler) => {
    registeredHandlers[channel] = handler;
  }),
};

const fromWebContents = jest.fn();

jest.mock('electron', () => ({
  ipcMain,
  BrowserWindow: {
    fromWebContents,
  },
}));

const {
  attachWindowStateSync,
  bindWindowControlsBridge,
} = require('../../../src/modules/runtime-host/presentation/adapters/window-controls-adapter');

async function withPlatform(platform, callback) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');

  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: platform,
  });

  try {
    await callback();
  } finally {
    Object.defineProperty(process, 'platform', originalDescriptor);
  }
}

function createTargetWindow(overrides = {}) {
  const listeners = {};
  const targetWindow = {
    on: jest.fn((eventName, handler) => {
      listeners[eventName] = handler;
    }),
    isMaximized: jest.fn(() => false),
    isFullScreen: jest.fn(() => false),
    isDestroyed: jest.fn(() => false),
    minimize: jest.fn(),
    maximize: jest.fn(),
    unmaximize: jest.fn(),
    setFullScreen: jest.fn(),
    close: jest.fn(),
    webContents: {
      send: jest.fn(),
    },
    ...overrides,
  };

  return { targetWindow, listeners };
}

describe('window controls bridge', () => {
  beforeEach(() => {
    Object.keys(registeredHandlers).forEach((key) => delete registeredHandlers[key]);
    jest.clearAllMocks();
  });

  test('attachWindowStateSync registra listeners y sincroniza el estado', () => {
    const { targetWindow, listeners } = createTargetWindow({
      isMaximized: jest.fn(() => true),
    });

    attachWindowStateSync(targetWindow);

    expect(targetWindow.on).toHaveBeenCalledWith('maximize', expect.any(Function));
    expect(targetWindow.on).toHaveBeenCalledWith('unmaximize', expect.any(Function));
    expect(targetWindow.on).toHaveBeenCalledWith('enter-full-screen', expect.any(Function));
    expect(targetWindow.on).toHaveBeenCalledWith('leave-full-screen', expect.any(Function));
    expect(targetWindow.on).toHaveBeenCalledWith('ready-to-show', expect.any(Function));

    listeners.maximize();

    expect(targetWindow.webContents.send).toHaveBeenCalledWith('window-controls:state-changed', {
      isMaximized: true,
      isFullScreen: false,
      platform: process.platform,
    });
  });

  test('attachWindowStateSync no emite cuando la ventana ya fue destruida', () => {
    const { targetWindow, listeners } = createTargetWindow({
      isDestroyed: jest.fn(() => true),
    });

    attachWindowStateSync(targetWindow);
    listeners['ready-to-show']();

    expect(targetWindow.webContents.send).not.toHaveBeenCalled();
  });

  test('bindWindowControlsBridge registra handlers para todas las acciones', () => {
    const { targetWindow } = createTargetWindow();
    fromWebContents.mockReturnValue(targetWindow);

    bindWindowControlsBridge();

    expect(Object.keys(registeredHandlers).sort()).toEqual([
      'window-controls:close',
      'window-controls:get-state',
      'window-controls:minimize',
      'window-controls:toggle-maximize',
    ]);
  });

  test('get-state devuelve el estado de la ventana del sender', async () => {
    const { targetWindow } = createTargetWindow({
      isMaximized: jest.fn(() => true),
      isFullScreen: jest.fn(() => true),
    });
    fromWebContents.mockReturnValue(targetWindow);

    bindWindowControlsBridge();
    const state = await registeredHandlers['window-controls:get-state']({ sender: {} });

    expect(state).toEqual({
      ok: true,
      data: {
        isMaximized: true,
        isFullScreen: true,
        platform: process.platform,
      },
    });
  });

  test('minimize invoca minimize y devuelve el estado actualizado', async () => {
    const { targetWindow } = createTargetWindow();
    fromWebContents.mockReturnValue(targetWindow);

    bindWindowControlsBridge();
    const state = await registeredHandlers['window-controls:minimize']({ sender: {} });

    expect(targetWindow.minimize).toHaveBeenCalled();
    expect(state).toEqual({
      ok: true,
      data: {
        isMaximized: false,
        isFullScreen: false,
        platform: process.platform,
      },
    });
  });

  test('toggle-maximize maximiza cuando la ventana no esta maximizada', async () => {
    const { targetWindow } = createTargetWindow({
      isMaximized: jest.fn(() => false),
    });
    fromWebContents.mockReturnValue(targetWindow);

    let state;
    await withPlatform('win32', async () => {
      bindWindowControlsBridge();
      state = await registeredHandlers['window-controls:toggle-maximize']({ sender: {} });
    });

    expect(targetWindow.maximize).toHaveBeenCalled();
    expect(targetWindow.unmaximize).not.toHaveBeenCalled();
    expect(targetWindow.setFullScreen).not.toHaveBeenCalled();
    expect(state).toEqual({
      ok: true,
      data: {
        isMaximized: false,
        isFullScreen: false,
        platform: 'win32',
      },
    });
  });

  test('toggle-maximize restaura cuando la ventana ya esta maximizada', async () => {
    const { targetWindow } = createTargetWindow({
      isMaximized: jest.fn(() => true),
    });
    fromWebContents.mockReturnValue(targetWindow);

    let state;
    await withPlatform('win32', async () => {
      bindWindowControlsBridge();
      state = await registeredHandlers['window-controls:toggle-maximize']({ sender: {} });
    });

    expect(targetWindow.unmaximize).toHaveBeenCalled();
    expect(targetWindow.maximize).not.toHaveBeenCalled();
    expect(targetWindow.setFullScreen).not.toHaveBeenCalled();
    expect(state).toEqual({
      ok: true,
      data: {
        isMaximized: true,
        isFullScreen: false,
        platform: 'win32',
      },
    });
  });

  test('toggle-maximize usa full screen en macOS', async () => {
    const { targetWindow } = createTargetWindow({
      isFullScreen: jest.fn(() => false),
    });
    fromWebContents.mockReturnValue(targetWindow);

    let state;
    await withPlatform('darwin', async () => {
      bindWindowControlsBridge();
      state = await registeredHandlers['window-controls:toggle-maximize']({ sender: {} });
    });

    expect(targetWindow.setFullScreen).toHaveBeenCalledWith(true);
    expect(targetWindow.maximize).not.toHaveBeenCalled();
    expect(targetWindow.unmaximize).not.toHaveBeenCalled();
    expect(state).toEqual({
      ok: true,
      data: {
        isMaximized: false,
        isFullScreen: false,
        platform: 'darwin',
      },
    });
  });

  test('close cierra la ventana y responde null', async () => {
    const { targetWindow } = createTargetWindow();
    fromWebContents.mockReturnValue(targetWindow);

    bindWindowControlsBridge();
    const result = await registeredHandlers['window-controls:close']({ sender: {} });

    expect(targetWindow.close).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: null });
  });

  test('lanza un error claro cuando no puede resolver la ventana del sender', async () => {
    fromWebContents.mockReturnValue(null);

    bindWindowControlsBridge();

    await expect(registeredHandlers['window-controls:get-state']({ sender: {} })).resolves.toEqual({
      ok: false,
      error: 'Unable to resolve the BrowserWindow for the sender.',
    });
  });
});







