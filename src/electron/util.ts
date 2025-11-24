import { ipcMain, type WebContents, type WebFrameMain } from 'electron';
import { pathToFileURL } from 'url';
import { getUIPath } from './pathResolver.js';

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (args: unknown) => Promise<EventPayloadMapping[Key]>,
) {
  ipcMain.handle(key, async (event, args) => {
    // Validate event
    if (event.senderFrame) {
      validateEventFrame(event.senderFrame);
      return handler(args);
    }
    throw new Error('Malicious event');
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key],
) {
  webContents.send(key, payload);
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => void,
) {
  ipcMain.on(key, (event) => {
    if (event.senderFrame) {
      validateEventFrame(event.senderFrame);
      handler();
    }
  });
}

export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === 'localhost:3000') {
    return;
  }
  const uiPath = pathToFileURL(getUIPath()).toString();
  if (frame.url !== uiPath) {
    throw new Error('Malicious event');
  }
}
