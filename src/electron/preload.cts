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
  deleteBucket: (id: number) => ipcInvoke('db:deleteBucket', id),
  getBucketCategories: () => ipcInvoke('db:getBucketCategories'),
  createBucketCategory: (params: CreateBucketCategoryParams) =>
    ipcInvoke('db:createBucketCategory', params),
  getAccounts: () => ipcInvoke('db:getAccounts'),
  createAccount: (params: CreateAccountParams) =>
    ipcInvoke('db:createAccount', params),
  getAccountsWithBuckets: () => ipcInvoke('db:getAccountsWithBuckets'),
  getTransactions: () => ipcInvoke('db:getTransactions'),
  getTransaction: (id: number) => ipcInvoke('db:getTransaction', id),
  getTransactionsByBucket: (bucketId: number) =>
    ipcInvoke('db:getTransactionsByBucket', bucketId),
  createTransaction: (params: CreateTransactionParams) =>
    ipcInvoke('db:createTransaction', params),
  batchCreateTransactions: (paramsArray: CreateTransactionParams[]) =>
    ipcInvoke('db:batchCreateTransactions', paramsArray),
  updateTransaction: (id: number, params: UpdateTransactionParams) =>
    ipcInvoke('db:updateTransaction', { id, params }),
  deleteTransaction: (id: number) => ipcInvoke('db:deleteTransaction', id),
  checkDuplicateTransaction: (params: {
    transaction_date: string;
    amount: number;
    from_bucket_id: number | null;
    to_bucket_id: number | null;
    notes: string | null;
  }) => ipcInvoke('db:checkDuplicateTransaction', params),
  getExpenseTransactionsByPeriod: (
    params: GetExpenseTransactionsByPeriodParams,
  ) => ipcInvoke('db:getExpenseTransactionsByPeriod', params),
  getBucketFromKeywords: (notes: string | null) =>
    ipcInvoke('db:getBucketFromKeywords', notes),
  getKeywordBucketMappings: () => ipcInvoke('db:getKeywordBucketMappings'),
  getValueHistoryWithTransactionsByBucket: (
    params: GetValueHistoryWithTransactionsByBucketParams,
  ) => ipcInvoke('db:getValueHistoryWithTransactionsByBucket', params),
  getBucketValueHistoriesByBucket: (
    params: GetBucketValueHistoriesByBucketParams,
  ) => ipcInvoke('db:getBucketValueHistoriesByBucket', params),
  createBucketValueHistory: (params: CreateBucketValueHistoryParams) =>
    ipcInvoke('db:createBucketValueHistory', params),
  updateBucketValueHistory: (
    id: number,
    params: UpdateBucketValueHistoryParams,
  ) => ipcInvoke('db:updateBucketValueHistory', { id, params }),
  deleteBucketValueHistory: (id: number) =>
    ipcInvoke('db:deleteBucketValueHistory', id),
  getAssetsValueHistory: (params: GetAssetsValueHistoryParams) =>
    ipcInvoke('db:getAssetsValueHistory', params),
  getBucketGoalsWithStatus: (bucketId: number) =>
    ipcInvoke('db:getBucketGoalsWithStatus', bucketId),
  getAllBucketGoalsWithStatus: () =>
    ipcInvoke('db:getAllBucketGoalsWithStatus'),
  createBucketGoal: (params: CreateBucketGoalParams) =>
    ipcInvoke('db:createBucketGoal', params),
  updateBucketGoal: (id: number, params: UpdateBucketGoalParams) =>
    ipcInvoke('db:updateBucketGoal', { id, params }),
  deleteBucketGoal: (id: number) => ipcInvoke('db:deleteBucketGoal', id),

  // Income Source methods
  getIncomeSources: () => ipcInvoke('db:getIncomeSources'),
  getIncomeSource: (id: number) => ipcInvoke('db:getIncomeSource', id),
  createIncomeSource: (params: CreateIncomeSourceParams) =>
    ipcInvoke('db:createIncomeSource', params),
  updateIncomeSource: (id: number, params: UpdateIncomeSourceParams) =>
    ipcInvoke('db:updateIncomeSource', { id, params }),
  deleteIncomeSource: (id: number) => ipcInvoke('db:deleteIncomeSource', id),

  // Income Category methods
  getIncomeCategories: () => ipcInvoke('db:getIncomeCategories'),
  getIncomeCategory: (id: number) => ipcInvoke('db:getIncomeCategory', id),
  createIncomeCategory: (params: CreateIncomeCategoryParams) =>
    ipcInvoke('db:createIncomeCategory', params),
  updateIncomeCategory: (id: number, params: UpdateIncomeCategoryParams) =>
    ipcInvoke('db:updateIncomeCategory', { id, params }),
  deleteIncomeCategory: (id: number) =>
    ipcInvoke('db:deleteIncomeCategory', id),

  // Income History methods
  getIncomeHistories: () => ipcInvoke('db:getIncomeHistories'),
  getIncomeHistory: (id: number) => ipcInvoke('db:getIncomeHistory', id),
  getIncomeHistoriesByPeriod: (params: GetIncomeHistoriesByPeriodParams) =>
    ipcInvoke('db:getIncomeHistoriesByPeriod', params),
  getIncomeHistoriesBySource: (incomeId: number) =>
    ipcInvoke('db:getIncomeHistoriesBySource', incomeId),
  createIncomeHistory: (params: CreateIncomeHistoryParams) =>
    ipcInvoke('db:createIncomeHistory', params),
  updateIncomeHistory: (id: number, params: UpdateIncomeHistoryParams) =>
    ipcInvoke('db:updateIncomeHistory', { id, params }),
  deleteIncomeHistory: (id: number) => ipcInvoke('db:deleteIncomeHistory', id),

  // Income Tax methods
  getIncomeTaxes: () => ipcInvoke('db:getIncomeTaxes'),
  getIncomeTax: (id: number) => ipcInvoke('db:getIncomeTax', id),
  getIncomeTaxesByIncomeHistory: (incomeHistoryId: number) =>
    ipcInvoke('db:getIncomeTaxesByIncomeHistory', incomeHistoryId),
  createIncomeTax: (params: CreateIncomeTaxParams) =>
    ipcInvoke('db:createIncomeTax', params),
  updateIncomeTax: (id: number, params: UpdateIncomeTaxParams) =>
    ipcInvoke('db:updateIncomeTax', { id, params }),
  deleteIncomeTax: (id: number) => ipcInvoke('db:deleteIncomeTax', id),

  // Tax Category methods
  getTaxCategories: () => ipcInvoke('db:getTaxCategories'),
  getTaxCategory: (id: number) => ipcInvoke('db:getTaxCategory', id),
  createTaxCategory: (params: CreateTaxCategoryParams) =>
    ipcInvoke('db:createTaxCategory', params),
  updateTaxCategory: (id: number, params: UpdateTaxCategoryParams) =>
    ipcInvoke('db:updateTaxCategory', { id, params }),
  deleteTaxCategory: (id: number) => ipcInvoke('db:deleteTaxCategory', id),

  // User Preferences methods
  getUserPreference: (params: GetUserPreferenceParams) =>
    ipcInvoke('db:getUserPreference', params),
  upsertUserPreference: (params: UpsertUserPreferenceParams) =>
    ipcInvoke('db:upsertUserPreference', params),

  // Settings
  getHiddenBuckets: () => ipcInvoke('db:getHiddenBuckets'),

  // Event listeners
  onBatchCreateTransactionsProgress: (
    callback: (progress: BatchCreateTransactionsProgress) => void,
  ) => {
    const listener = (
      _event: unknown,
      progress: BatchCreateTransactionsProgress,
    ) => {
      callback(progress);
    };
    electron.ipcRenderer.on('db:batchCreateTransactions:progress', listener);
    return () => {
      electron.ipcRenderer.removeListener(
        'db:batchCreateTransactions:progress',
        listener,
      );
    };
  },
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
