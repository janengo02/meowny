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
  getBuckets: () => ipcInvoke('db:getBuckets'),
  getBucket: (id: number) => ipcInvoke('db:getBucket', id),
  createBucket: (params: CreateBucketParams) =>
    ipcInvoke('db:createBucket', params),
  updateBucket: (id: number, params: UpdateBucketParams) =>
    ipcInvoke('db:updateBucket', { id, params }),
  getBucketCategories: () => ipcInvoke('db:getBucketCategories'),
  createBucketCategory: (params: CreateBucketCategoryParams) =>
    ipcInvoke('db:createBucketCategory', params),
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
