import 'dotenv/config';
import { app, BrowserWindow } from 'electron';
import { ipcMainHandle, ipcMainOn, isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { createMenu } from './menu.js';
import * as auth from './database/auth.js';
import * as db from './database/index.js';

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

  // Auth handlers
  ipcMainHandle('auth:signUp', async (args) => {
    return auth.signUp(args as SignUpParams);
  });

  ipcMainHandle('auth:signIn', async (args) => {
    return auth.signIn(args as SignInParams);
  });

  ipcMainHandle('auth:signOut', auth.signOut);
  ipcMainHandle('auth:getUser', auth.getUser);

  // Database handlers
  ipcMainHandle('db:createBucket', async (args) => {
    return db.createBucket(args as CreateBucketParams);
  });
});
