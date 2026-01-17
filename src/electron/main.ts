import 'dotenv/config';
import { app, BrowserWindow } from 'electron';
import {
  ipcMainHandle,
  ipcMainHandleWithEvent,
  ipcMainOn,
  isDev,
} from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { createMenu } from './menu.js';
import * as auth from './database/auth.js';
import * as db from './database/index.js';
import './logger/index.js'; // Initialize logger

app.on('ready', async () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  // Install DevTools extensions in development mode after window is created
  if (isDev()) {
    try {
      // Dynamic import for ES modules compatibility
      const { installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } =
        await import('electron-devtools-installer');

      await installExtension(
        [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS],
        {
          loadExtensionOptions: {
            allowFileAccess: true,
          },
        },
      );
      console.log('DevTools extensions installed successfully');
    } catch (err) {
      // Silently handle extension installation errors as they're non-critical
      if (err instanceof Error && !err.message.includes('already loaded')) {
        console.warn('DevTools extensions installation warning:', err.message);
      }
    }
  }
  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000');
    // Automatically open DevTools in development
    mainWindow.webContents.openDevTools();
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
  ipcMainHandle('db:getHiddenBuckets', db.getHiddenBuckets);
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
  ipcMainHandle('db:updateBucketCategory', async (args) => {
    const { id, params } = args as { id: number; params: UpdateBucketCategoryParams };
    return db.updateBucketCategory(id, params);
  });
  ipcMainHandle('db:deleteBucketCategory', async (args) => {
    return db.deleteBucketCategory(args as number);
  });
  ipcMainHandle('db:getAccounts', db.getAccounts);
  ipcMainHandle('db:createAccount', async (args) => {
    return db.createAccount(args as CreateAccountParams);
  });
  ipcMainHandle('db:updateAccount', async (args) => {
    const { id, params } = args as { id: number; params: UpdateAccountParams };
    return db.updateAccount(id, params);
  });
  ipcMainHandle('db:deleteAccount', async (args) => {
    return db.deleteAccount(args as number);
  });
  ipcMainHandle('db:getAccountsWithBuckets', db.getAccountsWithBuckets);
  ipcMainHandle('db:getTransactions', db.getTransactions);
  ipcMainHandle('db:getTransaction', async (args) => {
    return db.getTransaction(args as number);
  });
  ipcMainHandle('db:getTransactionsByBucket', async (args) => {
    const params = args as GetTransactionsByBucketParams;
    return db.getTransactionsByBucket(
      params.bucketId,
      params.startDate,
      params.endDate,
    );
  });
  ipcMainHandle('db:createTransaction', async (args) => {
    return db.createTransaction(args as CreateTransactionParams);
  });
  ipcMainHandleWithEvent('db:batchCreateTransactions', async (args, event) => {
    return db.batchCreateTransactions(
      args as CreateTransactionParams[],
      (progress) => {
        // Send progress updates to renderer
        event.sender.send('db:batchCreateTransactions:progress', progress);
      },
    );
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
  ipcMainHandle('db:getExpenseTransactionsWithDatesByPeriod', async (args) => {
    return db.getExpenseTransactionsWithDatesByPeriod(
      args as GetExpenseTransactionsByPeriodParams,
    );
  });
  ipcMainHandle(
    'db:getExpenseTransactionsByCategoryAndPeriod',
    async (args) => {
      return db.getExpenseTransactionsByCategoryAndPeriod(
        args as GetExpenseTransactionsByCategoryAndPeriodParams,
      );
    },
  );
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
  ipcMainHandle('db:updateBucketValueHistory', async (args) => {
    const { id, params } = args as {
      id: number;
      params: UpdateBucketValueHistoryParams;
    };
    return db.updateBucketValueHistory(id, params);
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

  // User Preferences handlers
  ipcMainHandle('db:getUserPreference', async (args) => {
    return db.getUserPreference(args as GetUserPreferenceParams);
  });
  ipcMainHandle('db:upsertUserPreference', async (args) => {
    return db.upsertUserPreference(args as UpsertUserPreferenceParams);
  });

  // Dashboard handlers
  ipcMainHandle('db:getIncomeVsSavingsChartData', async (args) => {
    return db.getIncomeVsSavingsChartData(
      args as GetIncomeVsSavingsChartDataParams,
    );
  });
  ipcMainHandle('db:getAssetsOverTimeChartData', async (args) => {
    return db.getAssetsOverTimeChartData(
      args as GetAssetsOverTimeChartDataParams,
    );
  });
  ipcMainHandle('db:getExpensePieChartData', async (args) => {
    return db.getExpensePieChartData(args as GetExpensePieChartDataParams);
  });
  ipcMainHandle('db:getBucketGoalsChartData', async () => {
    return db.getBucketGoalsChartData();
  });
  ipcMainHandle('db:getIncomeOverTimeChartData', async (args) => {
    return db.getIncomeOverTimeChartData(
      args as GetIncomeOverTimeChartDataParams,
    );
  });
  ipcMainHandle('db:getBucketTransactionHistoryChartData', async (args) => {
    return db.getBucketTransactionHistoryChartData(
      args as GetBucketTransactionHistoryChartDataParams,
    );
  });
});
