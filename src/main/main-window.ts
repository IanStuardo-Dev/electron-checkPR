import { BrowserWindow } from 'electron';
import * as path from 'path';
import { attachWindowStateSync } from './ipc/window-controls';

function resolveDistAsset(...segments: string[]): string {
  return path.resolve(__dirname, '..', ...segments);
}

export function buildMainWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 1200,
    height: 800,
    minWidth: 1080,
    minHeight: 720,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#e2e8f0',
    webPreferences: {
      preload: resolveDistAsset('preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  };
}

export function resolveRendererTarget() {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  const isDevelopment = Boolean(rendererUrl) || process.env.NODE_ENV === 'development';

  return {
    rendererUrl,
    isDevelopment,
    productionFile: resolveDistAsset('index.html'),
  };
}

export function createWindow() {
  const mainWindow = new BrowserWindow(buildMainWindowOptions());
  attachWindowStateSync(mainWindow);

  const { rendererUrl, isDevelopment, productionFile } = resolveRendererTarget();

  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
  } else if (isDevelopment) {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(productionFile);
  }

  return mainWindow;
}
