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
// QUERIES
// ============================================
// Create Bucket
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
  'db:createBucket': Bucket;
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
    createBucket: (params: CreateBucketParams) => Promise<Bucket>;
  };
}
