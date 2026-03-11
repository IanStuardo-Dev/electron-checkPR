import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './main/ipc/register';
import { buildDefaultRepositoryProviderPorts } from './services/providers/repository-provider.bootstrap';
import { createRepositoryProviderRegistry } from './services/providers/repository-provider.composition';
import { RepositoryAnalysisSnapshotProvider } from './services/analysis/repository-analysis.snapshot-provider';
import { RepositoryAnalysisService } from './services/analysis/repository-analysis.service';

// Asegurarse de que las notificaciones estén habilitadas
app.setAppUserModelId(process.execPath);

export function buildMainWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 1200,
    height: 800,
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

  registerIpcHandlers(providerRegistry, repositoryAnalysisService);
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
