import type { IpcRendererEvent } from 'electron';

const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  frameMinimize: () => ipcSend('frameMinimize'),
  frameMaximize: () => ipcSend('frameMaximize'),
  frameClose: () => ipcSend('frameClose'),

  // Auth methods
  signUp: (params: SignUpParams) => ipcInvoke('auth:signUp', params),
  signIn: (params: SignInParams) => ipcInvoke('auth:signIn', params),
  signOut: () => ipcInvoke('auth:signOut'),
  getUser: () => ipcInvoke('auth:getUser'),

  // Database methods
  createBucket: (params: CreateBucketParams) =>
    ipcInvoke('db:createBucket', params),
  getBuckets: () => ipcInvoke('db:getBuckets'),
} satisfies Window['electron']);

function ipcSend<Key extends keyof EventPayloadMapping>(key: Key) {
  electron.ipcRenderer.send(key);
}

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  args?: unknown,
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void,
): UnSubscribeFunction {
  const cb = (_: IpcRendererEvent, payload: EventPayloadMapping[Key]) =>
    callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}
