const loadURL = jest.fn();
const loadFile = jest.fn();
const setWindowButtonVisibility = jest.fn();
const registeredAppEvents = new Map();
let readyCallback;
const appOn = jest.fn((eventName, handler) => {
  registeredAppEvents.set(eventName, handler);
});
const appQuit = jest.fn();
const whenReadyThen = jest.fn((callback) => {
  readyCallback = callback;
});
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
    whenReady: jest.fn(() => ({ then: whenReadyThen })),
    on: appOn,
    quit: appQuit,
  },
  BrowserWindow: Object.assign(browserWindowMock, {
    getAllWindows: jest.fn(() => []),
  }),
}));

jest.mock('../../../src/main/runtime-host-bridge-registration', () => ({
  wireRuntimeHostBridge: jest.fn(),
}));

jest.mock('../../../src/modules/runtime-host/application/session-secrets/services/session-secrets-store.service', () => ({
  SessionSecretsStore: jest.fn().mockImplementation(() => ({ kind: 'session-secrets-store' })),
}));

jest.mock('../../../src/modules/runtime-host/presentation/adapters/window-controls-adapter', () => ({
  attachWindowStateSync: jest.fn(),
}));

jest.mock('../../../src/services/providers/repository-provider.bootstrap', () => ({
  buildDefaultRepositoryProviderPorts: jest.fn(() => []),
  buildDefaultRepositoryProviderModules: jest.fn(() => []),
  registerDefaultRepositoryProviders: jest.fn(),
}));

const { wireRuntimeHostBridge } = require('../../../src/main/runtime-host-bridge-registration');
const { SessionSecretsStore } = require('../../../src/modules/runtime-host/application/session-secrets/services/session-secrets-store.service');
const { attachWindowStateSync } = require('../../../src/modules/runtime-host/presentation/adapters/window-controls-adapter');
const {
  buildDefaultRepositoryProviderModules,
  registerDefaultRepositoryProviders,
} = require('../../../src/services/providers/repository-provider.bootstrap');
jest.mock('../../../src/services/providers/repository-provider.composition', () => ({
  createRepositoryProviderRegistry: jest.fn(() => ({ get: jest.fn(), list: jest.fn(() => []) })),
  createRepositoryProviderRegistryFromModules: jest.fn(() => ({ get: jest.fn(), list: jest.fn(() => []) })),
}));
const {
  createRepositoryProviderRegistryFromModules,
} = require('../../../src/services/providers/repository-provider.composition');
const main = require('../../../src/main');
const { app, BrowserWindow } = require('electron');

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

  test('resolveAppStoragePaths usa appData cuando LOCALAPPDATA no esta disponible', () => {
    process.env.LOCALAPPDATA = '   ';

    const storage = main.resolveAppStoragePaths();

    expect(app.getPath).toHaveBeenCalledWith('appData');
    expect(storage.userDataPath).toContain('AppData\\Roaming');
    expect(storage.userDataPath).toContain('CheckPR');
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

  test('bootstrapMainProcess registra providers, bridge y crea ventana', () => {
    main.bootstrapMainProcess();

    expect(buildDefaultRepositoryProviderModules).toHaveBeenCalled();
    expect(createRepositoryProviderRegistryFromModules).toHaveBeenCalled();
    expect(registerDefaultRepositoryProviders).not.toHaveBeenCalled();
    expect(SessionSecretsStore).toHaveBeenCalled();
    expect(wireRuntimeHostBridge).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      { kind: 'session-secrets-store' },
    );
    expect(browserWindowMock).toHaveBeenCalled();
  });

  test('cuando app esta lista ejecuta bootstrapMainProcess', () => {
    readyCallback();

    expect(buildDefaultRepositoryProviderModules).toHaveBeenCalled();
    expect(wireRuntimeHostBridge).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      { kind: 'session-secrets-store' },
    );
  });

  test('window-all-closed cierra la app fuera de macOS', () => {
    const windowAllClosedHandler = registeredAppEvents.get('window-all-closed');

    withPlatform('win32', () => {
      windowAllClosedHandler();
    });

    expect(appQuit).toHaveBeenCalled();
  });

  test('window-all-closed no cierra la app en macOS', () => {
    const windowAllClosedHandler = registeredAppEvents.get('window-all-closed');

    withPlatform('darwin', () => {
      windowAllClosedHandler();
    });

    expect(appQuit).not.toHaveBeenCalled();
  });

  test('activate crea una ventana solo cuando no hay ventanas abiertas', () => {
    const activateHandler = registeredAppEvents.get('activate');

    BrowserWindow.getAllWindows.mockReturnValue([]);
    activateHandler();
    expect(browserWindowMock).toHaveBeenCalledTimes(1);

    browserWindowMock.mockClear();
    BrowserWindow.getAllWindows.mockClear();
    BrowserWindow.getAllWindows.mockReturnValue([{}]);
    activateHandler();
    expect(browserWindowMock).not.toHaveBeenCalled();
  });
});







