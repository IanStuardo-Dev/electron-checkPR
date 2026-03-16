const loadURL = jest.fn();
const loadFile = jest.fn();
const setWindowButtonVisibility = jest.fn();
const browserWindowMock = jest.fn().mockImplementation(() => ({
  loadURL,
  loadFile,
  setWindowButtonVisibility,
  on: jest.fn(),
}));

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => 'C:\\Users\\ianst\\AppData\\Roaming'),
    setPath: jest.fn(),
    setAppUserModelId: jest.fn(),
    whenReady: jest.fn(() => ({ then: jest.fn() })),
    on: jest.fn(),
    quit: jest.fn(),
  },
  BrowserWindow: Object.assign(browserWindowMock, {
    getAllWindows: jest.fn(() => []),
  }),
}));

jest.mock('../../../src/main/ipc/register', () => ({
  registerIpcHandlers: jest.fn(),
}));

jest.mock('../../../src/main/ipc/window-controls', () => ({
  attachWindowStateSync: jest.fn(),
}));

jest.mock('../../../src/services/providers/repository-provider.bootstrap', () => ({
  buildDefaultRepositoryProviderPorts: jest.fn(() => []),
  registerDefaultRepositoryProviders: jest.fn(),
}));

const { registerIpcHandlers } = require('../../../src/main/ipc/register');
const { attachWindowStateSync } = require('../../../src/main/ipc/window-controls');
const {
  buildDefaultRepositoryProviderPorts,
  registerDefaultRepositoryProviders,
} = require('../../../src/services/providers/repository-provider.bootstrap');
const main = require('../../../src/main');

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

describe('main process bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOCALAPPDATA = 'C:\\Users\\ianst\\AppData\\Local';
    delete process.env.ELECTRON_RENDERER_URL;
    delete process.env.NODE_ENV;
  });

  test('resolveAppStoragePaths usa LOCALAPPDATA para aislar cache y session data', () => {
    const storage = main.resolveAppStoragePaths();

    expect(storage.userDataPath).toContain('AppData\\Local');
    expect(storage.userDataPath).toContain('CheckPR');
    expect(storage.sessionDataPath).toContain('SessionData');
  });

  test('buildMainWindowOptions endurece webPreferences', () => {
    const options = main.buildMainWindowOptions();

    expect(options.frame).toBe(false);
    expect(options.titleBarOverlay).toBe(false);
    expect(options.titleBarStyle).toBe('hidden');
    expect(options.webPreferences).toEqual(expect.objectContaining({
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: expect.stringContaining('preload.js'),
    }));
  });

  test('resolveRendererTarget prioriza rendererUrl y conoce target de produccion', () => {
    process.env.ELECTRON_RENDERER_URL = 'http://localhost:8080';
    const target = main.resolveRendererTarget();

    expect(target.rendererUrl).toBe('http://localhost:8080');
    expect(target.isDevelopment).toBe(true);
    expect(target.productionFile).toContain('index.html');
  });

  test('createWindow carga el renderer correcto segun entorno', () => {
    process.env.NODE_ENV = 'production';
    main.createWindow();
    expect(browserWindowMock).toHaveBeenCalledWith(expect.objectContaining({
      webPreferences: expect.objectContaining({
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      }),
    }));
    expect(attachWindowStateSync).toHaveBeenCalled();
    expect(loadFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));

    jest.clearAllMocks();
    process.env.ELECTRON_RENDERER_URL = 'http://localhost:8080';
    main.createWindow();
    expect(loadURL).toHaveBeenCalledWith('http://localhost:8080');
  });

  test('createWindow oculta los controles nativos en macOS', () => {
    withPlatform('darwin', () => {
      main.createWindow();
    });

    expect(setWindowButtonVisibility).toHaveBeenCalledWith(false);
  });

  test('bootstrapMainProcess registra providers, ipc y crea ventana', () => {
    main.bootstrapMainProcess();

    expect(buildDefaultRepositoryProviderPorts).toHaveBeenCalled();
    expect(registerDefaultRepositoryProviders).not.toHaveBeenCalled();
    expect(registerIpcHandlers).toHaveBeenCalled();
    expect(browserWindowMock).toHaveBeenCalled();
  });
});
