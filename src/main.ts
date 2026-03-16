import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './main/ipc/register';
import { attachWindowStateSync } from './main/ipc/window-controls';
import { buildDefaultRepositoryProviderPorts } from './services/providers/repository-provider.bootstrap';
import { createRepositoryProviderRegistry } from './services/providers/repository-provider.composition';
import { RepositoryAnalysisSnapshotProvider } from './services/analysis/repository-analysis.snapshot-provider';
import { RepositoryAnalysisService } from './services/analysis/repository-analysis.service';
import { PullRequestAnalysisSnapshotProvider } from './services/analysis/pull-request-analysis.snapshot-provider';
import { PullRequestAnalysisService } from './services/analysis/pull-request-analysis.service';

const APP_ID = 'com.checkpr.desktop';
const APP_STORAGE_DIRNAME = 'CheckPR';

export function resolveAppStoragePaths() {
  const localAppDataRoot = process.env.LOCALAPPDATA;
  const appDataRoot = localAppDataRoot && localAppDataRoot.trim().length > 0
    ? localAppDataRoot
    : app.getPath('appData');
  const userDataPath = path.join(appDataRoot, APP_STORAGE_DIRNAME);

  return {
    userDataPath,
    sessionDataPath: path.join(userDataPath, 'SessionData'),
  };
}

export function configureAppStorage(): void {
  const { userDataPath, sessionDataPath } = resolveAppStoragePaths();
  app.setPath('userData', userDataPath);
  app.setPath('sessionData', sessionDataPath);
}

configureAppStorage();

// Asegurarse de que las notificaciones estén habilitadas
app.setAppUserModelId(APP_ID);

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
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  };
}

export function resolveRendererTarget() {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  const isDevelopment = Boolean(rendererUrl) || process.env.NODE_ENV === 'development';

  return {
    rendererUrl,
    isDevelopment,
    productionFile: path.join(__dirname, '../dist/index.html'),
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

export function bootstrapMainProcess() {
  const providerRegistry = createRepositoryProviderRegistry(buildDefaultRepositoryProviderPorts());
  const repositoryAnalysisService = new RepositoryAnalysisService(
    new RepositoryAnalysisSnapshotProvider(providerRegistry),
  );
  const pullRequestAnalysisService = new PullRequestAnalysisService(
    new PullRequestAnalysisSnapshotProvider(providerRegistry),
  );

  registerIpcHandlers(providerRegistry, repositoryAnalysisService, pullRequestAnalysisService);
  createWindow();
}

app.whenReady().then(() => {
  bootstrapMainProcess();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
