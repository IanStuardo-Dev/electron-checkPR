const loadURL = jest.fn();
const loadFile = jest.fn();
const browserWindowMock = jest.fn().mockImplementation(() => ({
  loadURL,
  loadFile,
}));

jest.mock('electron', () => ({
  app: {
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

jest.mock('../../../src/services/providers/repository-provider.bootstrap', () => ({
  buildDefaultRepositoryProviderPorts: jest.fn(() => []),
  registerDefaultRepositoryProviders: jest.fn(),
}));

const { registerIpcHandlers } = require('../../../src/main/ipc/register');
const {
  buildDefaultRepositoryProviderPorts,
  registerDefaultRepositoryProviders,
} = require('../../../src/services/providers/repository-provider.bootstrap');
const main = require('../../../src/main');

describe('main process bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ELECTRON_RENDERER_URL;
    delete process.env.NODE_ENV;
  });

  test('buildMainWindowOptions endurece webPreferences', () => {
    const options = main.buildMainWindowOptions();

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
    expect(target.productionFile).toContain('/dist/index.html');
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
    expect(loadFile).toHaveBeenCalledWith(expect.stringContaining('/dist/index.html'));

    jest.clearAllMocks();
    process.env.ELECTRON_RENDERER_URL = 'http://localhost:8080';
    main.createWindow();
    expect(loadURL).toHaveBeenCalledWith('http://localhost:8080');
  });

  test('bootstrapMainProcess registra providers, ipc y crea ventana', () => {
    main.bootstrapMainProcess();

    expect(buildDefaultRepositoryProviderPorts).toHaveBeenCalled();
    expect(registerDefaultRepositoryProviders).not.toHaveBeenCalled();
    expect(registerIpcHandlers).toHaveBeenCalled();
    expect(browserWindowMock).toHaveBeenCalled();
  });
});
