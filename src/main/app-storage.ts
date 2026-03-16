import { app } from 'electron';
import * as path from 'path';

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
