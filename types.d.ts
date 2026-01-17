// ============================================
// ENUM TYPES
// ============================================

type ColorEnum =
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'violet'
  | 'orange'
  | 'pink'
  | 'emerald'
  | 'gray'
  | 'brown'
  | 'navy'
  | 'cyan'
  | 'magenta'
  | 'teal'
  | 'lime'
  | 'indigo'
  | 'default';

type AccountTypeEnum = 'expense' | 'asset';

type BucketTypeEnum = 'expense' | 'saving' | 'investment';

type SourceTypeEnum = 'transaction' | 'market';

// ============================================
// DATABASE ENTITY TYPES
// ============================================

type BucketCategory = {
  id: number;
  user_id: string;
  name: string;
  color: ColorEnum;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Account = {
  id: number;
  user_id: string;
  name: string;
  type: AccountTypeEnum;
  color: ColorEnum;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AccountWithBuckets = Account & {
  buckets: Bucket[];
};

type AccountsByType = {
  asset: AccountWithBuckets[];
  expense: AccountWithBuckets[];
};

// Normalized response structure for Redux state
type NormalizedAccountsResponse = {
  accounts: {
    byId: Record<number, Account>;
    byType: {
      asset: number[];
      expense: number[];
    };
  };
  buckets: {
    byId: Record<number, Bucket>;
    byAccountId: Record<number, number[]>;
    byCategoryId: Record<number, number[]>;
  };
  categories: {
    byId: Record<number, BucketCategory>;
  };
};

type Bucket = {
  id: number;
  user_id: string;
  name: string;
  type: BucketTypeEnum;
  bucket_category_id: number | null;
  account_id: number | null;
  contributed_amount: number;
  market_value: number;
  is_hidden: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Unit tracking fields for investment buckets
  total_units: number | null;
};

type BucketGoal = {
  id: number;
  user_id: string;
  bucket_id: number;
  min_amount: number | null;
  max_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type BucketGoalWithStatus = BucketGoal & {
  is_active: boolean;
  current_status: number;
};

type AllBucketGoalsWithStatus = BucketGoalWithStatus & {
  bucket_name: string;
  bucket_type: BucketTypeEnum;
};

type Transaction = {
  id: number;
  user_id: string;
  from_bucket_id: number | null;
  to_bucket_id: number | null;
  amount: number;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Unit tracking fields for investment buckets
  from_units: number | null;
  to_units: number | null;
};

type BucketValueHistory = {
  id: number;
  user_id: string;
  bucket_id: number;
  contributed_amount: number;
  market_value: number;
  recorded_at: string;
  source_type: SourceTypeEnum;
  source_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Unit tracking fields for investment buckets
  total_units: number | null;
  // Note: avg_cost_per_unit can be calculated as contributed_amount / total_units
  // Delta columns for performance optimization (added in migration 007)
  contributed_amount_delta: number;
  market_value_delta: number;
  total_units_delta: number | null;
};

type IncomeSource = {
  id: number;
  user_id: string;
  name: string;
  color: ColorEnum;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type IncomeCategory = {
  id: number;
  user_id: string;
  name: string;
  color: ColorEnum;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type BucketAssignCount = {
  from_bucket_id: number | null;
  to_bucket_id: number | null;
  count: number;
};

type BucketPair = {
  from_bucket_id: number | null;
  to_bucket_id: number | null;
};

type KeywordBucketMapping = {
  id: number;
  user_id: string;
  keyword: string;
  bucket_assign_count: BucketAssignCount[];
  created_at: string;
  updated_at: string;
};

type IncomeHistory = {
  id: number;
  user_id: string;
  income_id: number;
  income_category_id: number | null;
  gross_amount: number;
  received_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type TaxCategory = {
  id: number;
  user_id: string;
  name: string;
  color: ColorEnum;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type IncomeTax = {
  id: number;
  user_id: string;
  income_history_id: number;
  tax_category_id: number | null;
  tax_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type IncomeHistoryWithTaxes = IncomeHistory & {
  income_taxes: Pick<IncomeTax, 'id' | 'tax_amount'>[];
  net_amount: number;
};

type UserPreference = {
  id: number;
  user_id: string;
  preference_key: string;
  preference_value: unknown;
  created_at: string;
  updated_at: string;
};

// ============================================
// DASHBOARD LAYOUT TYPES
// ============================================

type DashboardSectionType =
  | 'assetsOverTimeChart'
  | 'expensePieChart'
  | 'bucketGoalsChart'
  | 'incomeOverTimeChart'
  | 'incomeVsSavingsChart'
  | 'assetAccounts'
  | 'expenseAccounts'
  | 'income';

// Individual chart sections
type DashboardAssetsOverTimeChartSection = {
  type: 'assetsOverTimeChart';
};

type DashboardExpensePieChartSection = {
  type: 'expensePieChart';
};

type DashboardBucketGoalsChartSection = {
  type: 'bucketGoalsChart';
};

type DashboardIncomeOverTimeChartSection = {
  type: 'incomeOverTimeChart';
};

type DashboardIncomeVsSavingsChartSection = {
  type: 'incomeVsSavingsChart';
};

// Account and income sections
type AssetAccountItem = {
  accountId: number;
  bucketOrder: number[];
};

type DashboardAssetAccountsSection = {
  type: 'assetAccounts';
  accounts: AssetAccountItem[];
};

type DashboardExpenseAccountsSection = {
  type: 'expenseAccounts';
};

type DashboardIncomeSection = {
  type: 'income';
};

type DashboardSection =
  | DashboardAssetsOverTimeChartSection
  | DashboardExpensePieChartSection
  | DashboardBucketGoalsChartSection
  | DashboardIncomeOverTimeChartSection
  | DashboardIncomeVsSavingsChartSection
  | DashboardAssetAccountsSection
  | DashboardExpenseAccountsSection
  | DashboardIncomeSection;

type DashboardColumn = {
  id: string;
  width: number; // Total = 12 (Bootstrap grid system)
  sections: DashboardSection[]; // Support multiple sections stacked vertically
};

type DashboardRow = {
  id: string;
  order: number;
  columns: DashboardColumn[];
};

type DashboardLayout = {
  rows: DashboardRow[];
};

type DashboardLayoutPreference = {
  dashboard_layout: DashboardLayout;
};

type AssetAccountListLayoutPreference = {
  columns: 1 | 2 | 3;
  columnWidths: number[];
  accountOrder?: number[][]; // Array of account IDs for each column
};

type ExpenseAccountListLayoutPreference = {
  accountOrder?: number[]; // Array of account IDs in order
};

type BucketOrderPreference = {
  [accountId: number]: number[]; // Map of account ID to ordered bucket IDs
};

// ============================================
// QUERY PARAMS
// ============================================

// Bucket
type CreateBucketParams = {
  name: string;
  type: BucketTypeEnum;
  bucket_category_id?: number | null;
  account_id?: number | null;
  contributed_amount?: number;
  market_value?: number;
  is_hidden?: boolean;
  notes?: string | null;
};

type UpdateBucketParams = {
  name?: string;
  type?: BucketTypeEnum;
  bucket_category_id?: number | null;
  account_id?: number | null;
  contributed_amount?: number;
  market_value?: number;
  total_units?: number | null;
  is_hidden?: boolean;
  notes?: string | null;
};

// Bucket Category
type CreateBucketCategoryParams = {
  name: string;
  color?: ColorEnum;
  notes?: string | null;
};

type UpdateBucketCategoryParams = {
  name?: string;
  color?: ColorEnum;
  notes?: string | null;
};

// Account
type CreateAccountParams = {
  name: string;
  type: AccountTypeEnum;
  color?: ColorEnum;
  notes?: string | null;
};

type UpdateAccountParams = {
  name?: string;
  type?: AccountTypeEnum;
  color?: ColorEnum;
  notes?: string | null;
};

// Bucket Goal
type CreateBucketGoalParams = {
  bucket_id: number;
  min_amount?: number | null;
  max_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
};

type UpdateBucketGoalParams = {
  bucket_id?: number;
  min_amount?: number | null;
  max_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
};

// Bucket Value History
type CreateBucketValueHistoryParams = {
  bucket_id: number;
  contributed_amount?: number;
  market_value?: number;
  total_units?: number | null;
  recorded_at: string;
  source_type: SourceTypeEnum;
  source_id?: number | null;
  notes?: string | null;
  // Delta columns for performance optimization
  contributed_amount_delta?: number;
  market_value_delta?: number;
  total_units_delta?: number | null;
};

type UpdateBucketValueHistoryParams = {
  bucket_id?: number;
  contributed_amount?: number;
  market_value?: number;
  total_units?: number | null;
  recorded_at?: string;
  source_type?: SourceTypeEnum;
  source_id?: number | null;
  notes?: string | null;
  // Delta columns for performance optimization
  contributed_amount_delta?: number;
  market_value_delta?: number;
  total_units_delta?: number | null;
};

type GetAssetsValueHistoryParams = {
  startDate: string;
  endDate: string;
};

type GetValueHistoryWithTransactionsByBucketParams = {
  bucketId: number;
  startDate?: string;
  endDate?: string;
};

type GetBucketValueHistoriesByBucketParams = {
  bucketId: number;
  startDate?: string;
  endDate?: string;
};

// Transaction
type CreateTransactionParams = {
  from_bucket_id?: number | null;
  to_bucket_id?: number | null;
  amount: number;
  transaction_date: string;
  notes?: string | null;
  // Unit tracking fields for investment buckets
  from_units?: number | null;
  to_units?: number | null;
};

type UpdateTransactionParams = CreateTransactionParams;

type ExpenseTransactionSummary = {
  bucket_id: number;
  bucket_name: string;
  total_amount: number;
  category_id: number | null;
  category_name: string | null;
  account_id: number | null;
  account_name: string | null;
};

type GetExpenseTransactionsByPeriodParams = {
  startDate: string;
  endDate: string;
};

type GetExpenseTransactionsByCategoryAndPeriodParams = {
  categoryId: number | null;
  startDate: string;
  endDate: string;
};

type GetTransactionsByBucketParams = {
  bucketId: number;
  startDate?: string;
  endDate?: string;
};

type GetIncomeVsSavingsChartDataParams = {
  startDate: string;
  endDate: string;
  mode: 'month' | 'year';
};

type IncomeVsSavingsChartData = {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
  assetContributionData: number[];
};

type GetAssetsOverTimeChartDataParams = {
  startDate: string;
  endDate: string;
  mode: 'month' | 'year';
  groupBy: 'bucket' | 'account' | 'category';
};

type AssetsOverTimeChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
};

type GetExpensePieChartDataParams = {
  startDate: string;
  endDate: string;
  groupBy: 'bucket' | 'account' | 'category';
};

type ExpensePieChartData = {
  labels: string[];
  values: number[];
  ids: (number | null)[];
};

type BucketGoalsChartData = {
  labels: string[];
  bucketTypes: BucketTypeEnum[];
  datasets: {
    label: string;
    data: number[];
    metadata: number[] | { amount: number; target?: number }[];
  }[];
};

type GetIncomeOverTimeChartDataParams = {
  startDate: string;
  endDate: string;
  mode: 'month' | 'year';
};

type IncomeOverTimeChartData = {
  labels: string[];
  grossByCategory: {
    label: string;
    data: number[];
  }[];
  netByCategory: {
    label: string;
    data: number[];
  }[];
  grossTotal: number[];
  netTotal: number[];
};

type GetBucketTransactionHistoryChartDataParams = {
  bucketId: number;
  startDate: string;
  endDate: string;
  mode: 'month' | 'year';
};

type BucketTransactionHistoryChartData = {
  labels: string[];
  data: number[];
};

type GetBucketValueHistoryChartDataParams = {
  bucketId: number;
  startDate: string;
  endDate: string;
  mode: 'month' | 'year';
};

type BucketValueHistoryChartData = {
  labels: string[];
  contributedAmounts: number[];
  gains: number[];
  losses: number[];
};

type GetExpenseCategoryChartDataParams = {
  categoryId: number | null;
  startDate: string;
  endDate: string;
  mode: 'month' | 'year';
};

type ExpenseCategoryChartData = {
  labels: string[];
  data: number[];
};

// Income Source
type CreateIncomeSourceParams = {
  name: string;
  color?: ColorEnum;
  is_active?: boolean;
  notes?: string | null;
};

type UpdateIncomeSourceParams = {
  name?: string;
  color?: ColorEnum;
  is_active?: boolean;
  notes?: string | null;
};

// Income Category
type CreateIncomeCategoryParams = {
  name: string;
  color?: ColorEnum;
  notes?: string | null;
};

type UpdateIncomeCategoryParams = {
  name?: string;
  color?: ColorEnum;
  notes?: string | null;
};

// Income History
type CreateIncomeHistoryParams = {
  income_id: number;
  income_category_id?: number | null;
  gross_amount: number;
  received_date?: string;
  notes?: string | null;
};

type UpdateIncomeHistoryParams = {
  income_id?: number;
  income_category_id?: number | null;
  gross_amount?: number;
  received_date?: string;
  notes?: string | null;
};

type GetIncomeHistoriesByPeriodParams = {
  startDate?: string;
  endDate?: string;
};

// Tax Category
type CreateTaxCategoryParams = {
  name: string;
  color?: ColorEnum;
  notes?: string | null;
};

type UpdateTaxCategoryParams = {
  name?: string;
  color?: ColorEnum;
  notes?: string | null;
};

// Income Tax
type CreateIncomeTaxParams = {
  income_history_id: number;
  tax_category_id?: number | null;
  tax_amount: number;
  notes?: string | null;
};

type UpdateIncomeTaxParams = {
  income_history_id?: number;
  tax_category_id?: number | null;
  tax_amount?: number;
  notes?: string | null;
};

// User Preferences
type GetUserPreferenceParams = {
  preference_key: string;
};

type UpsertUserPreferenceParams = {
  preference_key: string;
  preference_value: unknown;
};

// ============================================
// AUTH TYPES
// ============================================
type AuthUser = {
  id: string;
  email: string;
};

type SignUpParams = {
  email: string;
  password: string;
  name: string;
};

type SignInParams = {
  email: string;
  password: string;
};

// Transaction with bucket names (for value history query)
type TransactionWithBucketNames = Transaction & {
  from_bucket_name: string | null;
  to_bucket_name: string | null;
};

// Value History with Transaction
type ValueHistoryWithTransaction = BucketValueHistory & {
  transaction: TransactionWithBucketNames | null;
};

type BucketValueHistoryWithTransaction = BucketValueHistory & {
  transaction?: {
    amount: number;
    from_bucket_id: number | null;
    to_bucket_id: number | null;
    from_units: number | null;
    to_units: number | null;
  } | null;
};

// Bucket Value History with Bucket details
type BucketValueHistoryWithBucket = BucketValueHistory & {
  bucket: {
    id: number;
    name: string;
    type: BucketTypeEnum;
  };
};

// Assets value history grouped by bucket
type AssetsBucketData = {
  id: number;
  name: string;
  type: BucketTypeEnum;
  category: {
    id: number;
    name: string;
    color: ColorEnum;
  } | null;
  account: {
    id: number;
    name: string;
    color: ColorEnum;
  } | null;
  history: Pick<
    BucketValueHistory,
    | 'id'
    | 'market_value'
    | 'contributed_amount'
    | 'recorded_at'
    | 'source_type'
    | 'created_at'
  >[];
};

type AssetsValueHistoryResponse = {
  buckets: AssetsBucketData[];
};

// ============================================
// IPC EVENT TYPES
// ============================================

type BatchCreateTransactionsProgress = {
  completed: number;
  total: number;
  lastTransaction?: {
    index: number; // Index in the original params array
    status: 'success' | 'error';
    error?: string; // Error message if failed
  };
};

type BatchCreateTransactionsResult = {
  successCount: number;
  failedCount: number;
};

// CSV Import Template Types
type CsvImportTemplate = {
  template_name: string;
  csv_headers: string[]; // Array of CSV column headers to match against
  strategy: 'single_transaction' | 'deposit_withdrawal' | 'transaction_with_category';
  column_mapping: {
    transactionDate: string;
    transactionAmount?: string;
    depositAmount?: string;
    withdrawalAmount?: string;
    categoryColumn?: string;
    depositValue?: string;
    withdrawalValue?: string;
    notes?: string;
    units?: string;
  };
  created_at: string;
};

type EventPayloadMapping = {
  frameMinimize: void;
  frameMaximize: void;
  frameClose: void;

  // Auth events
  'auth:signUp': AuthUser;
  'auth:signIn': AuthUser;
  'auth:signOut': void;
  'auth:getUser': AuthUser | null;

  // Database events
  'db:getBuckets': Bucket[];
  'db:getHiddenBuckets': Bucket[];
  'db:getBucket': Bucket;
  'db:createBucket': Bucket;
  'db:updateBucket': Bucket;
  'db:deleteBucket': void;
  'db:getBucketCategories': BucketCategory[];
  'db:createBucketCategory': BucketCategory;
  'db:updateBucketCategory': BucketCategory;
  'db:deleteBucketCategory': void;
  'db:getAccounts': Account[];
  'db:createAccount': Account;
  'db:updateAccount': Account;
  'db:deleteAccount': void;
  'db:getAccountsWithBuckets': NormalizedAccountsResponse;
  'db:getTransactions': Transaction[];
  'db:getTransaction': Transaction;
  'db:getTransactionsByBucket': Transaction[];
  'db:createTransaction': Transaction;
  'db:batchCreateTransactions': BatchCreateTransactionsResult;
  'db:batchCreateTransactions:progress': BatchCreateTransactionsProgress;
  'db:updateTransaction': Transaction;
  'db:deleteTransaction': void;
  'db:checkDuplicateTransaction': boolean;
  'db:getExpenseTransactionsByPeriod': ExpenseTransactionSummary[];
  'db:getExpenseTransactionsWithDatesByPeriod': Transaction[];
  'db:getExpenseTransactionsByCategoryAndPeriod': Transaction[];
  'db:getBucketFromKeywords': BucketPair | null;
  'db:getKeywordBucketMappings': KeywordBucketMapping[];
  'db:getValueHistoryWithTransactionsByBucket': ValueHistoryWithTransaction[];
  'db:getBucketValueHistoriesByBucket': BucketValueHistory[];
  'db:createBucketValueHistory': BucketValueHistory;
  'db:updateBucketValueHistory': BucketValueHistory;
  'db:deleteBucketValueHistory': void;
  'db:getAssetsValueHistory': AssetsValueHistoryResponse;
  'db:getBucketGoalsWithStatus': BucketGoalWithStatus[];
  'db:getAllBucketGoalsWithStatus': AllBucketGoalsWithStatus[];
  'db:createBucketGoal': BucketGoal;
  'db:updateBucketGoal': BucketGoal;
  'db:deleteBucketGoal': void;
  'db:getIncomeSources': IncomeSource[];
  'db:getIncomeSource': IncomeSource;
  'db:createIncomeSource': IncomeSource;
  'db:updateIncomeSource': IncomeSource;
  'db:deleteIncomeSource': void;
  'db:getIncomeCategories': IncomeCategory[];
  'db:getIncomeCategory': IncomeCategory;
  'db:createIncomeCategory': IncomeCategory;
  'db:updateIncomeCategory': IncomeCategory;
  'db:deleteIncomeCategory': void;
  'db:getIncomeHistories': IncomeHistory[];
  'db:getIncomeHistory': IncomeHistory;
  'db:getIncomeHistoriesByPeriod': IncomeHistoryWithTaxes[];
  'db:getIncomeHistoriesBySource': IncomeHistory[];
  'db:createIncomeHistory': IncomeHistory;
  'db:updateIncomeHistory': IncomeHistory;
  'db:deleteIncomeHistory': void;
  'db:getIncomeTaxes': IncomeTax[];
  'db:getIncomeTax': IncomeTax;
  'db:getIncomeTaxesByIncomeHistory': IncomeTax[];
  'db:createIncomeTax': IncomeTax;
  'db:updateIncomeTax': IncomeTax;
  'db:deleteIncomeTax': void;
  'db:getTaxCategories': TaxCategory[];
  'db:getTaxCategory': TaxCategory;
  'db:createTaxCategory': TaxCategory;
  'db:updateTaxCategory': TaxCategory;
  'db:deleteTaxCategory': void;
  'db:getUserPreference': UserPreference | null;
  'db:upsertUserPreference': UserPreference;
  'db:getIncomeVsSavingsChartData': IncomeVsSavingsChartData;
  'db:getAssetsOverTimeChartData': AssetsOverTimeChartData;
  'db:getExpensePieChartData': ExpensePieChartData;
  'db:getBucketGoalsChartData': BucketGoalsChartData;
  'db:getIncomeOverTimeChartData': IncomeOverTimeChartData;
  'db:getBucketTransactionHistoryChartData': BucketTransactionHistoryChartData;
  'db:getBucketValueHistoryChartData': BucketValueHistoryChartData;
  'db:getExpenseCategoryChartData': ExpenseCategoryChartData;
};

type UnSubscribeFunction = () => void;

interface Window {
  electron: {
    frameMinimize: () => void;
    frameMaximize: () => void;
    frameClose: () => void;

    // Auth methods
    signUp: (params: SignUpParams) => Promise<AuthUser>;
    signIn: (params: SignInParams) => Promise<AuthUser>;
    signOut: () => Promise<void>;
    getUser: () => Promise<AuthUser | null>;

    // Database methods
    getBuckets: () => Promise<Bucket[]>;
    getHiddenBuckets: () => Promise<Bucket[]>;
    getBucket: (id: number) => Promise<Bucket>;
    createBucket: (params: CreateBucketParams) => Promise<Bucket>;
    updateBucket: (id: number, params: UpdateBucketParams) => Promise<Bucket>;
    deleteBucket: (id: number) => Promise<void>;
    getBucketCategories: () => Promise<BucketCategory[]>;
    createBucketCategory: (
      params: CreateBucketCategoryParams,
    ) => Promise<BucketCategory>;
    updateBucketCategory: (
      id: number,
      params: UpdateBucketCategoryParams,
    ) => Promise<BucketCategory>;
    deleteBucketCategory: (id: number) => Promise<void>;
    getAccounts: () => Promise<Account[]>;
    createAccount: (params: CreateAccountParams) => Promise<Account>;
    updateAccount: (
      id: number,
      params: UpdateAccountParams,
    ) => Promise<Account>;
    deleteAccount: (id: number) => Promise<void>;
    getAccountsWithBuckets: () => Promise<NormalizedAccountsResponse>;
    getTransactions: () => Promise<Transaction[]>;
    getTransaction: (id: number) => Promise<Transaction>;
    getTransactionsByBucket: (
      params: GetTransactionsByBucketParams,
    ) => Promise<Transaction[]>;
    createTransaction: (
      params: CreateTransactionParams,
    ) => Promise<Transaction>;
    batchCreateTransactions: (
      paramsArray: CreateTransactionParams[],
    ) => Promise<BatchCreateTransactionsResult>;
    updateTransaction: (
      id: number,
      params: UpdateTransactionParams,
    ) => Promise<Transaction>;
    deleteTransaction: (id: number) => Promise<void>;
    checkDuplicateTransaction: (params: {
      transaction_date: string;
      amount: number;
      from_bucket_id: number | null;
      to_bucket_id: number | null;
      notes: string | null;
      from_units?: number | null;
      to_units?: number | null;
    }) => Promise<boolean>;
    getExpenseTransactionsByPeriod: (
      params: GetExpenseTransactionsByPeriodParams,
    ) => Promise<ExpenseTransactionSummary[]>;
    getExpenseTransactionsWithDatesByPeriod: (
      params: GetExpenseTransactionsByPeriodParams,
    ) => Promise<Transaction[]>;
    getExpenseTransactionsByCategoryAndPeriod: (
      params: GetExpenseTransactionsByCategoryAndPeriodParams,
    ) => Promise<Transaction[]>;
    getBucketFromKeywords: (notes: string | null) => Promise<BucketPair | null>;
    getKeywordBucketMappings: () => Promise<KeywordBucketMapping[]>;
    getValueHistoryWithTransactionsByBucket: (
      params: GetValueHistoryWithTransactionsByBucketParams,
    ) => Promise<ValueHistoryWithTransaction[]>;
    getBucketValueHistoriesByBucket: (
      params: GetBucketValueHistoriesByBucketParams,
    ) => Promise<BucketValueHistory[]>;
    createBucketValueHistory: (
      params: CreateBucketValueHistoryParams,
    ) => Promise<BucketValueHistory>;
    updateBucketValueHistory: (
      id: number,
      params: UpdateBucketValueHistoryParams,
    ) => Promise<BucketValueHistory>;
    deleteBucketValueHistory: (id: number) => Promise<void>;
    getAssetsValueHistory: (
      params: GetAssetsValueHistoryParams,
    ) => Promise<AssetsValueHistoryResponse>;
    getBucketGoalsWithStatus: (
      bucketId: number,
    ) => Promise<BucketGoalWithStatus[]>;
    getAllBucketGoalsWithStatus: () => Promise<AllBucketGoalsWithStatus[]>;
    createBucketGoal: (params: CreateBucketGoalParams) => Promise<BucketGoal>;
    updateBucketGoal: (
      id: number,
      params: UpdateBucketGoalParams,
    ) => Promise<BucketGoal>;
    deleteBucketGoal: (id: number) => Promise<void>;

    // Income Source methods
    getIncomeSources: () => Promise<IncomeSource[]>;
    getIncomeSource: (id: number) => Promise<IncomeSource>;
    createIncomeSource: (
      params: CreateIncomeSourceParams,
    ) => Promise<IncomeSource>;
    updateIncomeSource: (
      id: number,
      params: UpdateIncomeSourceParams,
    ) => Promise<IncomeSource>;
    deleteIncomeSource: (id: number) => Promise<void>;

    // Income Category methods
    getIncomeCategories: () => Promise<IncomeCategory[]>;
    getIncomeCategory: (id: number) => Promise<IncomeCategory>;
    createIncomeCategory: (
      params: CreateIncomeCategoryParams,
    ) => Promise<IncomeCategory>;
    updateIncomeCategory: (
      id: number,
      params: UpdateIncomeCategoryParams,
    ) => Promise<IncomeCategory>;
    deleteIncomeCategory: (id: number) => Promise<void>;

    // Income History methods
    getIncomeHistories: () => Promise<IncomeHistory[]>;
    getIncomeHistory: (id: number) => Promise<IncomeHistory>;
    getIncomeHistoriesByPeriod: (
      params: GetIncomeHistoriesByPeriodParams,
    ) => Promise<IncomeHistoryWithTaxes[]>;
    getIncomeHistoriesBySource: (incomeId: number) => Promise<IncomeHistory[]>;
    createIncomeHistory: (
      params: CreateIncomeHistoryParams,
    ) => Promise<IncomeHistory>;
    updateIncomeHistory: (
      id: number,
      params: UpdateIncomeHistoryParams,
    ) => Promise<IncomeHistory>;
    deleteIncomeHistory: (id: number) => Promise<void>;

    // Income Tax methods
    getIncomeTaxes: () => Promise<IncomeTax[]>;
    getIncomeTax: (id: number) => Promise<IncomeTax>;
    getIncomeTaxesByIncomeHistory: (
      incomeHistoryId: number,
    ) => Promise<IncomeTax[]>;
    createIncomeTax: (params: CreateIncomeTaxParams) => Promise<IncomeTax>;
    updateIncomeTax: (
      id: number,
      params: UpdateIncomeTaxParams,
    ) => Promise<IncomeTax>;
    deleteIncomeTax: (id: number) => Promise<void>;

    // Tax Category methods
    getTaxCategories: () => Promise<TaxCategory[]>;
    getTaxCategory: (id: number) => Promise<TaxCategory>;
    createTaxCategory: (
      params: CreateTaxCategoryParams,
    ) => Promise<TaxCategory>;
    updateTaxCategory: (
      id: number,
      params: UpdateTaxCategoryParams,
    ) => Promise<TaxCategory>;
    deleteTaxCategory: (id: number) => Promise<void>;

    // User Preferences methods
    getUserPreference: (
      params: GetUserPreferenceParams,
    ) => Promise<UserPreference | null>;
    upsertUserPreference: (
      params: UpsertUserPreferenceParams,
    ) => Promise<UserPreference>;

    // Dashboard methods
    getIncomeVsSavingsChartData: (
      params: GetIncomeVsSavingsChartDataParams,
    ) => Promise<IncomeVsSavingsChartData>;
    getAssetsOverTimeChartData: (
      params: GetAssetsOverTimeChartDataParams,
    ) => Promise<AssetsOverTimeChartData>;
    getExpensePieChartData: (
      params: GetExpensePieChartDataParams,
    ) => Promise<ExpensePieChartData>;
    getBucketGoalsChartData: () => Promise<BucketGoalsChartData>;
    getIncomeOverTimeChartData: (
      params: GetIncomeOverTimeChartDataParams,
    ) => Promise<IncomeOverTimeChartData>;
    getBucketTransactionHistoryChartData: (
      params: GetBucketTransactionHistoryChartDataParams,
    ) => Promise<BucketTransactionHistoryChartData>;
    getBucketValueHistoryChartData: (
      params: GetBucketValueHistoryChartDataParams,
    ) => Promise<BucketValueHistoryChartData>;
    getExpenseCategoryChartData: (
      params: GetExpenseCategoryChartDataParams,
    ) => Promise<ExpenseCategoryChartData>;

    // Event listeners
    onBatchCreateTransactionsProgress: (
      callback: (progress: BatchCreateTransactionsProgress) => void,
    ) => () => void;
  };
}
