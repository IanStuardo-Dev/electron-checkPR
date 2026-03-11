import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { pullRequestService } from './services/azure/pr.service';
import { gitHubRepositoryService } from './services/github/repository.service';
import { gitLabRepositoryService } from './services/gitlab/repository.service';
import { repositoryAnalysisService } from './services/analysis/repository-analysis.service';

interface IpcSuccessResponse<T> {
  ok: true;
  data: T;
}

interface IpcErrorResponse {
  ok: false;
  error: string;
}

// Asegurarse de que las notificaciones estén habilitadas
app.setAppUserModelId(process.execPath);

const ALLOWED_EXTERNAL_HOSTS = new Set([
  'dev.azure.com',
  'github.com',
  'gitlab.com',
]);

function isAllowedExternalHost(hostname: string): boolean {
  return ALLOWED_EXTERNAL_HOSTS.has(hostname) || hostname.endsWith('.visualstudio.com');
}

function validateExternalUrl(rawUrl: string): string {
  if (!rawUrl) {
    throw new Error('A valid URL is required.');
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('La URL externa no es valida.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Solo se permiten URLs externas con https.');
  }

  if (!isAllowedExternalHost(url.hostname)) {
    throw new Error(`El host ${url.hostname} no esta permitido para abrir enlaces externos.`);
  }

  return url.toString();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

async function safeIpcResponse<T>(task: () => Promise<T>): Promise<IpcSuccessResponse<T> | IpcErrorResponse> {
  try {
    return {
      ok: true,
      data: await task(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown IPC error.',
    };
  }
}

ipcMain.handle('azure:fetchPullRequests', async (_event, config) => {
  return safeIpcResponse(() => pullRequestService.getPullRequests(config));
});

ipcMain.handle('azure:fetchProjects', async (_event, config) => {
  return safeIpcResponse(() => pullRequestService.getProjects(config));
});

ipcMain.handle('azure:fetchRepositories', async (_event, config) => {
  return safeIpcResponse(() => pullRequestService.getRepositories(config));
});

ipcMain.handle('azure:fetchBranches', async (_event, config) => {
  return safeIpcResponse(() => pullRequestService.getBranches(config));
});

ipcMain.handle('azure:openExternal', async (_event, url: string) => {
  return safeIpcResponse(async () => {
    await shell.openExternal(validateExternalUrl(url));
  });
});

ipcMain.handle('github:fetchPullRequests', async (_event, config) => {
  return safeIpcResponse(() => gitHubRepositoryService.getPullRequests(config));
});

ipcMain.handle('github:fetchProjects', async (_event, config) => {
  return safeIpcResponse(() => gitHubRepositoryService.getProjects(config));
});

ipcMain.handle('github:fetchRepositories', async (_event, config) => {
  return safeIpcResponse(() => gitHubRepositoryService.getRepositories(config));
});

ipcMain.handle('github:fetchBranches', async (_event, config) => {
  return safeIpcResponse(() => gitHubRepositoryService.getBranches(config));
});

ipcMain.handle('github:openExternal', async (_event, url: string) => {
  return safeIpcResponse(async () => {
    await shell.openExternal(validateExternalUrl(url));
  });
});

ipcMain.handle('gitlab:fetchPullRequests', async (_event, config) => {
  return safeIpcResponse(() => gitLabRepositoryService.getPullRequests(config));
});

ipcMain.handle('gitlab:fetchProjects', async (_event, config) => {
  return safeIpcResponse(() => gitLabRepositoryService.getProjects(config));
});

ipcMain.handle('gitlab:fetchRepositories', async (_event, config) => {
  return safeIpcResponse(() => gitLabRepositoryService.getRepositories(config));
});

ipcMain.handle('gitlab:fetchBranches', async (_event, config) => {
  return safeIpcResponse(() => gitLabRepositoryService.getBranches(config));
});

ipcMain.handle('gitlab:openExternal', async (_event, url: string) => {
  return safeIpcResponse(async () => {
    await shell.openExternal(validateExternalUrl(url));
  });
});

ipcMain.handle('analysis:runRepositoryAnalysis', async (_event, payload) => {
  return safeIpcResponse(() => repositoryAnalysisService.runAnalysis(payload));
});

ipcMain.handle('analysis:cancelRepositoryAnalysis', async (_event, requestId: string) => {
  return safeIpcResponse(async () => {
    repositoryAnalysisService.cancelAnalysis(requestId);
  });
});

app.whenReady().then(createWindow);

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
