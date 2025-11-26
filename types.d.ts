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
  'db:getBucketCategories': BucketCategory[];
  'db:createBucketCategory': BucketCategory;
  'db:getBucketLocations': BucketLocation[];
  'db:createBucketLocation': BucketLocation;
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
    getBucketCategories: () => Promise<BucketCategory[]>;
    createBucketCategory: (
      params: CreateBucketCategoryParams,
    ) => Promise<BucketCategory>;
    getBucketLocations: () => Promise<BucketLocation[]>;
    createBucketLocation: (
      params: CreateBucketLocationParams,
    ) => Promise<BucketLocation>;
  };
}
