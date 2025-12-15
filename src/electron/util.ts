import { ipcMain, type WebContents, type WebFrameMain } from 'electron';
import { pathToFileURL } from 'url';
import { getUIPath } from './pathResolver.js';
import { logger } from './logger/index.js';

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (args: unknown) => Promise<EventPayloadMapping[Key]>,
) {
  ipcMain.handle(key, async (event, args) => {
    const endTimer = logger.startTimer('ipc', key as string);

    // Validate event
    if (event.senderFrame) {
      try {
        validateEventFrame(event.senderFrame);
      } catch (error) {
        logger.error('ipc', key as string, error as Error, {
          reason: 'Event validation failed',
        });
        endTimer();
        throw error;
      }

      try {
        logger.debug('ipc', key as string, 'Request received', { args });
        const result = await handler(args);
        logger.info('ipc', key as string, 'Request completed successfully');
        endTimer();
        return result;
      } catch (error) {
        // Ensure error is serializable across IPC
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred';
        logger.error('ipc', key as string, error as Error, { args });
        endTimer();
        throw new Error(message);
      }
    }

    const maliciousError = new Error('Malicious event');
    logger.error('ipc', key as string, maliciousError, {
      reason: 'No sender frame',
    });
    endTimer();
    throw maliciousError;
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
