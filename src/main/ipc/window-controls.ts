import { BrowserWindow, ipcMain } from 'electron';

const GET_STATE_CHANNEL = 'window-controls:get-state';
const MINIMIZE_CHANNEL = 'window-controls:minimize';
const TOGGLE_MAXIMIZE_CHANNEL = 'window-controls:toggle-maximize';
const CLOSE_CHANNEL = 'window-controls:close';
const STATE_CHANGED_CHANNEL = 'window-controls:state-changed';

function buildWindowState(targetWindow: BrowserWindow): WindowControlsState {
  return {
    isMaximized: targetWindow.isMaximized(),
    isFullScreen: targetWindow.isFullScreen(),
    platform: process.platform,
  };
}

function resolveSenderWindow(sender: Electron.WebContents): BrowserWindow {
  const targetWindow = BrowserWindow.fromWebContents(sender);

  if (!targetWindow) {
    throw new Error('Unable to resolve the BrowserWindow for the sender.');
  }

  return targetWindow;
}

function emitWindowState(targetWindow: BrowserWindow): void {
  if (targetWindow.isDestroyed()) {
    return;
  }

  targetWindow.webContents.send(STATE_CHANGED_CHANNEL, buildWindowState(targetWindow));
}

export function attachWindowStateSync(targetWindow: BrowserWindow): void {
  const syncWindowState = () => emitWindowState(targetWindow);

  targetWindow.on('maximize', syncWindowState);
  targetWindow.on('unmaximize', syncWindowState);
  targetWindow.on('enter-full-screen', syncWindowState);
  targetWindow.on('leave-full-screen', syncWindowState);
  targetWindow.on('ready-to-show', syncWindowState);
}

export function registerWindowControlsIpc(): void {
  ipcMain.handle(GET_STATE_CHANNEL, (event) => {
    const targetWindow = resolveSenderWindow(event.sender);
    return buildWindowState(targetWindow);
  });

  ipcMain.handle(MINIMIZE_CHANNEL, (event) => {
    const targetWindow = resolveSenderWindow(event.sender);
    targetWindow.minimize();
    return buildWindowState(targetWindow);
  });

  ipcMain.handle(TOGGLE_MAXIMIZE_CHANNEL, (event) => {
    const targetWindow = resolveSenderWindow(event.sender);

    if (targetWindow.isMaximized()) {
      targetWindow.unmaximize();
    } else {
      targetWindow.maximize();
    }

    return buildWindowState(targetWindow);
  });

  ipcMain.handle(CLOSE_CHANNEL, (event) => {
    const targetWindow = resolveSenderWindow(event.sender);
    targetWindow.close();
    return null;
  });
}
