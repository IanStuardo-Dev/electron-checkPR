import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { pullRequestService } from './services/azure/pr.service';
import { gitHubRepositoryService } from './services/github/repository.service';

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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
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
  if (!url) {
    throw new Error('A valid URL is required.');
  }

  await shell.openExternal(url);
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
  if (!url) {
    throw new Error('A valid URL is required.');
  }

  await shell.openExternal(url);
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
