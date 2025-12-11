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
  ipcMainHandle('db:getBuckets', db.getBuckets);
  ipcMainHandle('db:getBucket', async (args) => {
    return db.getBucket(args as number);
  });
  ipcMainHandle('db:createBucket', async (args) => {
    return db.createBucket(args as CreateBucketParams);
  });
  ipcMainHandle('db:updateBucket', async (args) => {
    const { id, params } = args as { id: number; params: UpdateBucketParams };
    return db.updateBucket(id, params);
  });
  ipcMainHandle('db:deleteBucket', async (args) => {
    return db.deleteBucket(args as number);
  });
  ipcMainHandle('db:getBucketCategories', db.getBucketCategories);
  ipcMainHandle('db:createBucketCategory', async (args) => {
    return db.createBucketCategory(args as CreateBucketCategoryParams);
  });
  ipcMainHandle('db:getBucketLocations', db.getBucketLocations);
  ipcMainHandle('db:createBucketLocation', async (args) => {
    return db.createBucketLocation(args as CreateBucketLocationParams);
  });
  ipcMainHandle('db:getTransactions', db.getTransactions);
  ipcMainHandle('db:getTransaction', async (args) => {
    return db.getTransaction(args as number);
  });
  ipcMainHandle('db:getTransactionsByBucket', async (args) => {
    return db.getTransactionsByBucket(args as number);
  });
  ipcMainHandle('db:createTransaction', async (args) => {
    return db.createTransaction(args as CreateTransactionParams);
  });
  ipcMainHandle('db:updateTransaction', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateTransactionParams;
    };
    return db.updateTransaction(id, params);
  });
  ipcMainHandle('db:deleteTransaction', async (args) => {
    return db.deleteTransaction(args as number);
  });
  ipcMainHandle('db:checkDuplicateTransaction', async (args) => {
    return db.checkDuplicateTransaction(args as {
      transaction_date: string;
      amount: number;
      from_bucket_id: number | null;
      to_bucket_id: number | null;
      notes: string | null;
    });
  });
  ipcMainHandle('db:getExpenseTransactionsByPeriod', async (args) => {
    return db.getExpenseTransactionsByPeriod(
      args as GetExpenseTransactionsByPeriodParams,
    );
  });
  ipcMainHandle('db:getBucketFromKeywords', async (args) => {
    return db.getBucketFromKeywords(args as string | null);
  });
  ipcMainHandle('db:getKeywordBucketMappings', db.getKeywordBucketMappings);
  ipcMainHandle('db:getValueHistoryWithTransactionsByBucket', async (args) => {
    return db.getValueHistoryWithTransactionsByBucket(
      args as GetValueHistoryWithTransactionsByBucketParams,
    );
  });
  ipcMainHandle('db:getBucketValueHistoriesByBucket', async (args) => {
    return db.getBucketValueHistoriesByBucket(
      args as GetBucketValueHistoriesByBucketParams,
    );
  });
  ipcMainHandle('db:createBucketValueHistory', async (args) => {
    return db.createBucketValueHistory(args as CreateBucketValueHistoryParams);
  });
  ipcMainHandle('db:deleteBucketValueHistory', async (args) => {
    return db.deleteBucketValueHistory(args as number);
  });
  ipcMainHandle('db:getAssetsValueHistory', async (args) => {
    return db.getAssetsValueHistory(args as GetAssetsValueHistoryParams);
  });
  ipcMainHandle('db:getBucketGoalsWithStatus', async (args) => {
    return db.getBucketGoalsWithStatus(args as number);
  });
  ipcMainHandle('db:getAllBucketGoalsWithStatus', async () => {
    return db.getAllBucketGoalsWithStatus();
  });
  ipcMainHandle('db:createBucketGoal', async (args) => {
    return db.createBucketGoal(args as CreateBucketGoalParams);
  });
  ipcMainHandle('db:updateBucketGoal', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateBucketGoalParams;
    };
    return db.updateBucketGoal(id, params);
  });
  ipcMainHandle('db:deleteBucketGoal', async (args) => {
    return db.deleteBucketGoal(args as number);
  });

  // Income Source handlers
  ipcMainHandle('db:getIncomeSources', db.getIncomeSources);
  ipcMainHandle('db:getIncomeSource', async (args) => {
    return db.getIncomeSource(args as number);
  });
  ipcMainHandle('db:createIncomeSource', async (args) => {
    return db.createIncomeSource(args as CreateIncomeSourceParams);
  });
  ipcMainHandle('db:updateIncomeSource', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateIncomeSourceParams;
    };
    return db.updateIncomeSource(id, params);
  });
  ipcMainHandle('db:deleteIncomeSource', async (args) => {
    return db.deleteIncomeSource(args as number);
  });

  // Income Category handlers
  ipcMainHandle('db:getIncomeCategories', db.getIncomeCategories);
  ipcMainHandle('db:getIncomeCategory', async (args) => {
    return db.getIncomeCategory(args as number);
  });
  ipcMainHandle('db:createIncomeCategory', async (args) => {
    return db.createIncomeCategory(args as CreateIncomeCategoryParams);
  });
  ipcMainHandle('db:updateIncomeCategory', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateIncomeCategoryParams;
    };
    return db.updateIncomeCategory(id, params);
  });
  ipcMainHandle('db:deleteIncomeCategory', async (args) => {
    return db.deleteIncomeCategory(args as number);
  });

  // Income History handlers
  ipcMainHandle('db:getIncomeHistories', db.getIncomeHistories);
  ipcMainHandle('db:getIncomeHistory', async (args) => {
    return db.getIncomeHistory(args as number);
  });
  ipcMainHandle('db:getIncomeHistoriesByPeriod', async (args) => {
    return db.getIncomeHistoriesByPeriod(
      args as GetIncomeHistoriesByPeriodParams,
    );
  });
  ipcMainHandle('db:getIncomeHistoriesBySource', async (args) => {
    return db.getIncomeHistoriesBySource(args as number);
  });
  ipcMainHandle('db:createIncomeHistory', async (args) => {
    return db.createIncomeHistory(args as CreateIncomeHistoryParams);
  });
  ipcMainHandle('db:updateIncomeHistory', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateIncomeHistoryParams;
    };
    return db.updateIncomeHistory(id, params);
  });
  ipcMainHandle('db:deleteIncomeHistory', async (args) => {
    return db.deleteIncomeHistory(args as number);
  });

  // Income Tax handlers
  ipcMainHandle('db:getIncomeTaxes', db.getIncomeTaxes);
  ipcMainHandle('db:getIncomeTax', async (args) => {
    return db.getIncomeTax(args as number);
  });
  ipcMainHandle('db:getIncomeTaxesByIncomeHistory', async (args) => {
    return db.getIncomeTaxesByIncomeHistory(args as number);
  });
  ipcMainHandle('db:createIncomeTax', async (args) => {
    return db.createIncomeTax(args as CreateIncomeTaxParams);
  });
  ipcMainHandle('db:updateIncomeTax', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateIncomeTaxParams;
    };
    return db.updateIncomeTax(id, params);
  });
  ipcMainHandle('db:deleteIncomeTax', async (args) => {
    return db.deleteIncomeTax(args as number);
  });

  // Tax Category handlers
  ipcMainHandle('db:getTaxCategories', db.getTaxCategories);
  ipcMainHandle('db:getTaxCategory', async (args) => {
    return db.getTaxCategory(args as number);
  });
  ipcMainHandle('db:createTaxCategory', async (args) => {
    return db.createTaxCategory(args as CreateTaxCategoryParams);
  });
  ipcMainHandle('db:updateTaxCategory', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateTaxCategoryParams;
    };
    return db.updateTaxCategory(id, params);
  });
  ipcMainHandle('db:deleteTaxCategory', async (args) => {
    return db.deleteTaxCategory(args as number);
  });
});
