import { app, BrowserWindow } from 'electron';
import { ipcMainOn, isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { createMenu } from './menu.js';

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
    frame: false,
  });
  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(getUIPath());
  }
  // Customize Menu
  createMenu();
  // Customize Frame
  ipcMainOn('frameMinimize', () => mainWindow.minimize());
  ipcMainOn('frameMaximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMainOn('frameClose', () => mainWindow.close());
});
