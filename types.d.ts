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

type BucketLocation = {
  id: number;
  user_id: string;
  name: string;
  color: ColorEnum;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Bucket = {
  id: number;
  user_id: string;
  name: string;
  type: BucketTypeEnum;
  bucket_category_id: number | null;
  bucket_location_id: number | null;
  contributed_amount: number;
  market_value: number;
  is_hidden: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
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

// ============================================
// QUERY PARAMS
// ============================================

// Bucket
type CreateBucketParams = {
  name: string;
  type: BucketTypeEnum;
  bucket_category_id?: number | null;
  bucket_location_id?: number | null;
  contributed_amount?: number;
  market_value?: number;
  is_hidden?: boolean;
  notes?: string | null;
};

type UpdateBucketParams = {
  name?: string;
  type?: BucketTypeEnum;
  bucket_category_id?: number | null;
  bucket_location_id?: number | null;
  contributed_amount?: number;
  market_value?: number;
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

// Bucket Location
type CreateBucketLocationParams = {
  name: string;
  color?: ColorEnum;
  notes?: string | null;
};

type UpdateBucketLocationParams = {
  name?: string;
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
  recorded_at?: string;
  source_type: SourceTypeEnum;
  source_id?: number | null;
  notes?: string | null;
};

type UpdateBucketValueHistoryParams = {
  bucket_id?: number;
  contributed_amount?: number;
  market_value?: number;
  recorded_at?: string;
  source_type?: SourceTypeEnum;
  source_id?: number | null;
  notes?: string | null;
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
  transaction_date?: string;
  notes?: string | null;
};

type UpdateTransactionParams = {
  from_bucket_id?: number | null;
  to_bucket_id?: number | null;
  amount?: number;
  transaction_date?: string;
  notes?: string | null;
};

type ExpenseTransactionSummary = {
  bucket_id: number;
  bucket_name: string;
  total_amount: number;
};

type GetExpenseTransactionsByPeriodParams = {
  startDate: string;
  endDate: string;
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
  location: {
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
  'db:getBucket': Bucket;
  'db:createBucket': Bucket;
  'db:updateBucket': Bucket;
  'db:deleteBucket': void;
  'db:getBucketCategories': BucketCategory[];
  'db:createBucketCategory': BucketCategory;
  'db:getBucketLocations': BucketLocation[];
  'db:createBucketLocation': BucketLocation;
  'db:getTransactions': Transaction[];
  'db:getTransaction': Transaction;
  'db:getTransactionsByBucket': Transaction[];
  'db:createTransaction': Transaction;
  'db:updateTransaction': Transaction;
  'db:deleteTransaction': void;
  'db:checkDuplicateTransaction': boolean;
  'db:getExpenseTransactionsByPeriod': ExpenseTransactionSummary[];
  'db:getBucketFromKeywords': number | null;
  'db:getValueHistoryWithTransactionsByBucket': ValueHistoryWithTransaction[];
  'db:getBucketValueHistoriesByBucket': BucketValueHistory[];
  'db:createBucketValueHistory': BucketValueHistory;
  'db:deleteBucketValueHistory': void;
  'db:getAssetsValueHistory': AssetsValueHistoryResponse;
  'db:getBucketGoalsWithStatus': BucketGoalWithStatus[];
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
    getBucket: (id: number) => Promise<Bucket>;
    createBucket: (params: CreateBucketParams) => Promise<Bucket>;
    updateBucket: (id: number, params: UpdateBucketParams) => Promise<Bucket>;
    deleteBucket: (id: number) => Promise<void>;
    getBucketCategories: () => Promise<BucketCategory[]>;
    createBucketCategory: (
      params: CreateBucketCategoryParams,
    ) => Promise<BucketCategory>;
    getBucketLocations: () => Promise<BucketLocation[]>;
    createBucketLocation: (
      params: CreateBucketLocationParams,
    ) => Promise<BucketLocation>;
    getTransactions: () => Promise<Transaction[]>;
    getTransaction: (id: number) => Promise<Transaction>;
    getTransactionsByBucket: (bucketId: number) => Promise<Transaction[]>;
    createTransaction: (
      params: CreateTransactionParams,
    ) => Promise<Transaction>;
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
    }) => Promise<boolean>;
    getExpenseTransactionsByPeriod: (
      params: GetExpenseTransactionsByPeriodParams,
    ) => Promise<ExpenseTransactionSummary[]>;
    getBucketFromKeywords: (notes: string | null) => Promise<number | null>;
    getValueHistoryWithTransactionsByBucket: (
      params: GetValueHistoryWithTransactionsByBucketParams,
    ) => Promise<ValueHistoryWithTransaction[]>;
    getBucketValueHistoriesByBucket: (
      params: GetBucketValueHistoriesByBucketParams,
    ) => Promise<BucketValueHistory[]>;
    createBucketValueHistory: (
      params: CreateBucketValueHistoryParams,
    ) => Promise<BucketValueHistory>;
    deleteBucketValueHistory: (id: number) => Promise<void>;
    getAssetsValueHistory: (
      params: GetAssetsValueHistoryParams,
    ) => Promise<AssetsValueHistoryResponse>;
    getBucketGoalsWithStatus: (
      bucketId: number,
    ) => Promise<BucketGoalWithStatus[]>;
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
  };
}
