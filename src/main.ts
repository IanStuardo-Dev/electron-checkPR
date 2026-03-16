import { app, BrowserWindow } from 'electron';
import { configureAppStorage } from './main/app-storage';
import { bootstrapMainProcess as bootstrapMainProcessImpl } from './main/application-bootstrap';
import { createWindow } from './main/main-window';

export { resolveAppStoragePaths } from './main/app-storage';
export { bootstrapMainProcess } from './main/application-bootstrap';
export { buildMainWindowOptions, createWindow, resolveRendererTarget } from './main/main-window';

const APP_ID = 'com.checkpr.desktop';

configureAppStorage();

// Asegurarse de que las notificaciones estén habilitadas
app.setAppUserModelId(APP_ID);

app.whenReady().then(() => {
  bootstrapMainProcessImpl();
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
