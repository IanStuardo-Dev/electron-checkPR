const handle = jest.fn();

jest.mock('electron', () => ({
  ipcMain: {
    handle,
  },
  BrowserWindow: {
    fromWebContents: jest.fn(),
  },
}));

const { ipcMain, BrowserWindow } = require('electron');
const { bindWindowControlsBridge } = require('../../../src/modules/runtime-host/presentation/adapters/window-controls-adapter');

function withPlatform(platform, callback) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');

  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: platform,
  });

  try {
    callback();
  } finally {
    Object.defineProperty(process, 'platform', originalDescriptor);
  }
}

describe('window controls bridge', () => {
  beforeEach(() => {
    ipcMain.handle.mockReset();
    BrowserWindow.fromWebContents.mockReset();
  });

  test('en macOS usa full screen para el toggle principal', () => {
    const targetWindow = {
      isFullScreen: jest.fn().mockReturnValue(false),
      setFullScreen: jest.fn(),
      isMaximized: jest.fn().mockReturnValue(false),
      maximize: jest.fn(),
      unmaximize: jest.fn(),
      close: jest.fn(),
      minimize: jest.fn(),
    };

    BrowserWindow.fromWebContents.mockReturnValue(targetWindow);

    withPlatform('darwin', () => {
      bindWindowControlsBridge();
      const toggleHandler = ipcMain.handle.mock.calls.find(([channel]) => channel === 'window-controls:toggle-maximize')[1];
      toggleHandler({ sender: {} });
    });

    expect(targetWindow.setFullScreen).toHaveBeenCalledWith(true);
    expect(targetWindow.maximize).not.toHaveBeenCalled();
    expect(targetWindow.unmaximize).not.toHaveBeenCalled();
  });
});







