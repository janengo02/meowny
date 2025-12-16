# Unit-Based Investment Tracking - Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding unit-based investment tracking to the Meowny application. The feature will allow users to track investments by number of units (shares) and price per unit, while maintaining full backward compatibility with the existing money-based transaction system.

### Key Design Decisions

Based on user requirements:
- ✅ Support transactions between two investment buckets with separate unit/price pairs
- ✅ Use Average Cost Basis for gains/losses calculation
- ✅ No transaction fees tracking (initially)
- ✅ No special dividend handling (initially)
- ✅ Support manual unit quantity adjustments (for stock splits, corrections)
- ✅ One bucket = one security (users can create multiple buckets for different securities)

---

## Current System Analysis

### Transaction Flow

Currently, transactions work with a single `amount` field representing money:

```
Transaction Record:
{
  from_bucket_id: number | null,
  to_bucket_id: number | null,
  amount: DECIMAL(19, 2),  // Single money value
  transaction_date: timestamp,
  notes: text
}
```

**When a transaction is created:**

1. **From Bucket Update:**
   - `contributed_amount -= amount`
   - `market_value -= amount`
   - Adjust all future history records

2. **To Bucket Update:**
   - `contributed_amount += amount`
   - `market_value += amount`
   - Adjust all future history records

### Bucket Value History

The `bucket_value_history` table is the source of truth:

```sql
CREATE TABLE bucket_value_history (
  bucket_id INT,
  contributed_amount DECIMAL(19, 2),
  market_value DECIMAL(19, 2),
  recorded_at TIMESTAMP,
  source_type ENUM('transaction', 'market'),
  source_id INT  -- transaction.id when source_type='transaction'
)
```

**Two types of history records:**
- `source_type='transaction'`: Created by money transfers
- `source_type='market'`: Created by manual market value updates

### Current Limitations

- Investment buckets can only track total dollar amount
- No unit (shares) tracking
- No price-per-unit history
- Gains/losses calculated as simple: `market_value - contributed_amount`
- Cannot track realized gains when selling portions of holdings

---

## Phase 1: Database Schema Extensions

### Migration File: `003_investment_units_tracking.sql`

```sql
-- ============================================
-- Add Unit Tracking to Transaction Table
-- ============================================

ALTER TABLE transaction ADD COLUMN from_units DECIMAL(19, 8);
ALTER TABLE transaction ADD COLUMN from_price_per_unit DECIMAL(19, 8);
ALTER TABLE transaction ADD COLUMN to_units DECIMAL(19, 8);
ALTER TABLE transaction ADD COLUMN to_price_per_unit DECIMAL(19, 8);

COMMENT ON COLUMN transaction.from_units IS 'Number of units sold from FROM bucket (investment buckets only)';
COMMENT ON COLUMN transaction.from_price_per_unit IS 'Price per unit at time of sale from FROM bucket';
COMMENT ON COLUMN transaction.to_units IS 'Number of units bought for TO bucket (investment buckets only)';
COMMENT ON COLUMN transaction.to_price_per_unit IS 'Price per unit at time of purchase for TO bucket';

-- ============================================
-- Add Unit Tracking to BucketValueHistory Table
-- ============================================

ALTER TABLE bucket_value_history ADD COLUMN total_units DECIMAL(19, 8);
ALTER TABLE bucket_value_history ADD COLUMN avg_cost_per_unit DECIMAL(19, 8);

COMMENT ON COLUMN bucket_value_history.total_units IS 'Running total of units at this point in time';
COMMENT ON COLUMN bucket_value_history.avg_cost_per_unit IS 'Average cost basis per unit at this point in time';

-- ============================================
-- Add Unit Tracking to Bucket Table
-- ============================================

ALTER TABLE bucket ADD COLUMN total_units DECIMAL(19, 8);
ALTER TABLE bucket ADD COLUMN avg_cost_per_unit DECIMAL(19, 8);

COMMENT ON COLUMN bucket.total_units IS 'Current total units (derived from latest history)';
COMMENT ON COLUMN bucket.avg_cost_per_unit IS 'Current average cost per unit (derived from latest history)';
```

### Schema Design Rationale

**Why separate `from_*` and `to_*` unit fields?**

This allows flexible investment-to-investment transactions:
```
Example: Rebalance portfolio
- Sell 10 shares of Apple @ $150 = $1,500
- Buy 5 shares of Tesla @ $300 = $1,500

Transaction record:
- from_units: 10
- from_price_per_unit: 150
- to_units: 5
- to_price_per_unit: 300
- amount: 1500
```

**Why nullable fields?**

Backward compatibility - existing transactions and non-investment buckets don't use units.

**Why DECIMAL(19, 8)?**

- 19 total digits provides large value support
- 8 decimal places supports fractional shares and precise price tracking

---

## Phase 2: TypeScript Type Updates

### File: `types.d.ts`

```typescript
// ============================================
// UPDATED TYPES
// ============================================

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

  // NEW: Unit tracking fields
  from_units: number | null;
  from_price_per_unit: number | null;
  to_units: number | null;
  to_price_per_unit: number | null;
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

  // NEW: Unit tracking fields
  total_units: number | null;
  avg_cost_per_unit: number | null;
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

  // NEW: Unit tracking fields
  total_units: number | null;
  avg_cost_per_unit: number | null;
};

// ============================================
// UPDATED PARAM TYPES
// ============================================

type CreateTransactionParams = {
  from_bucket_id?: number | null;
  to_bucket_id?: number | null;
  amount: number;
  transaction_date?: string;
  notes?: string | null;

  // NEW: Optional unit tracking
  from_units?: number | null;
  from_price_per_unit?: number | null;
  to_units?: number | null;
  to_price_per_unit?: number | null;
};

type UpdateTransactionParams = {
  from_bucket_id?: number | null;
  to_bucket_id?: number | null;
  amount?: number;
  transaction_date?: string;
  notes?: string | null;

  // NEW: Optional unit tracking
  from_units?: number | null;
  from_price_per_unit?: number | null;
  to_units?: number | null;
  to_price_per_unit?: number | null;
};
```

---

## Phase 3: Backend Logic Implementation

### File: `src/electron/database/queries/transaction.ts`

#### 3.1 Enhanced `createTransaction` Function

```typescript
export async function createTransaction(
  params: CreateTransactionParams,
): Promise<Transaction> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // ============================================
  // STEP 1: VALIDATION
  // ============================================

  if (params.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!params.from_bucket_id && !params.to_bucket_id) {
    throw new Error('At least one bucket (from or to) is required');
  }

  // Validate unit/price pairs
  if (params.from_units && !params.from_price_per_unit) {
    throw new Error('Price per unit required when units are specified');
  }
  if (params.to_units && !params.to_price_per_unit) {
    throw new Error('Price per unit required when units are specified');
  }

  // ============================================
  // STEP 2: GET BUCKET INFORMATION
  // ============================================

  let fromBucket: Bucket | null = null;
  let toBucket: Bucket | null = null;

  if (params.from_bucket_id) {
    fromBucket = await getBucket(params.from_bucket_id);
  }
  if (params.to_bucket_id) {
    toBucket = await getBucket(params.to_bucket_id);
  }

  // ============================================
  // STEP 3: CREATE TRANSACTION RECORD
  // ============================================

  const { data: transaction, error: transactionError } = await supabase
    .from('transaction')
    .insert({
      user_id: userId,
      from_bucket_id: params.from_bucket_id ?? null,
      to_bucket_id: params.to_bucket_id ?? null,
      amount: params.amount,
      transaction_date: params.transaction_date ?? new Date().toISOString(),
      notes: params.notes ?? null,
      from_units: params.from_units ?? null,
      from_price_per_unit: params.from_price_per_unit ?? null,
      to_units: params.to_units ?? null,
      to_price_per_unit: params.to_price_per_unit ?? null,
    })
    .select()
    .single();

  if (transactionError) throw new Error(transactionError.message);

  // ============================================
  // STEP 4: UPDATE KEYWORD BUCKET MAPPING
  // ============================================

  if (params.notes && params.from_bucket_id && params.to_bucket_id) {
    await updateKeywordBucketMapping(
      params.notes,
      params.from_bucket_id,
      params.to_bucket_id,
    );
  }

  // ============================================
  // STEP 5: UPDATE FROM BUCKET
  // ============================================

  if (fromBucket) {
    await updateBucketForTransaction(
      fromBucket,
      transaction,
      'from',
      params.from_units ?? null,
      params.from_price_per_unit ?? null,
    );
  }

  // ============================================
  // STEP 6: UPDATE TO BUCKET
  // ============================================

  if (toBucket) {
    await updateBucketForTransaction(
      toBucket,
      transaction,
      'to',
      params.to_units ?? null,
      params.to_price_per_unit ?? null,
    );
  }

  return transaction;
}
```

#### 3.2 New Helper Function: `updateBucketForTransaction`

```typescript
async function updateBucketForTransaction(
  bucket: Bucket,
  transaction: Transaction,
  direction: 'from' | 'to',
  units: number | null,
  pricePerUnit: number | null,
): Promise<void> {
  const isInvestment = bucket.type === 'investment';
  const isFrom = direction === 'from';
  const sign = isFrom ? -1 : 1;

  // Get last history before transaction date
  const lastHistory = await getLastBucketValueHistoryBeforeDate(
    bucket.id,
    transaction.transaction_date,
  );

  const oldContributedAmount = lastHistory?.contributed_amount ?? 0;
  const oldMarketValue = lastHistory?.market_value ?? 0;
  const oldTotalUnits = lastHistory?.total_units ?? 0;
  const oldAvgCostPerUnit = lastHistory?.avg_cost_per_unit ?? 0;

  let newContributedAmount: number;
  let newMarketValue: number;
  let newTotalUnits: number | null = null;
  let newAvgCostPerUnit: number | null = null;

  // ============================================
  // INVESTMENT BUCKET WITH UNITS
  // ============================================

  if (isInvestment && units && pricePerUnit) {
    newTotalUnits = oldTotalUnits + (sign * units);

    if (isFrom) {
      // SELLING units
      // Contributed amount reduces by cost basis
      newContributedAmount = oldContributedAmount - (units * oldAvgCostPerUnit);
      // Market value reduces by sale price
      newMarketValue = oldMarketValue - (units * pricePerUnit);
      // Average cost per unit stays the same
      newAvgCostPerUnit = oldAvgCostPerUnit;

    } else {
      // BUYING units
      // Contributed amount increases by purchase cost
      newContributedAmount = oldContributedAmount + (units * pricePerUnit);
      // Market value increases by purchase price (initially same as cost)
      newMarketValue = oldMarketValue + (units * pricePerUnit);
      // Recalculate average cost per unit using weighted average
      if (newTotalUnits > 0) {
        newAvgCostPerUnit = newContributedAmount / newTotalUnits;
      } else {
        newAvgCostPerUnit = 0;
      }
    }

  // ============================================
  // NON-INVESTMENT BUCKET OR NO UNITS
  // ============================================

  } else {
    // Traditional money-based transaction
    newContributedAmount = oldContributedAmount + (sign * transaction.amount);
    newMarketValue = oldMarketValue + (sign * transaction.amount);
    newTotalUnits = null;
    newAvgCostPerUnit = null;
  }

  // ============================================
  // CREATE HISTORY RECORD
  // ============================================

  await createBucketValueHistory({
    bucket_id: bucket.id,
    contributed_amount: newContributedAmount,
    market_value: newMarketValue,
    recorded_at: transaction.transaction_date,
    source_type: 'transaction',
    source_id: transaction.id,
    total_units: newTotalUnits,
    avg_cost_per_unit: newAvgCostPerUnit,
  });

  // ============================================
  // ADJUST FUTURE HISTORY RECORDS
  // ============================================

  await adjustBucketValueHistoryForHistoricalTransaction(
    bucket.id,
    transaction.transaction_date,
    sign * transaction.amount,  // contributed_amount delta
    sign * (units && pricePerUnit ? units * pricePerUnit : transaction.amount),  // market_value delta
    sign * (units ?? 0),  // units delta
    newAvgCostPerUnit,
  );

  // ============================================
  // UPDATE BUCKET FROM LATEST HISTORY
  // ============================================

  await updateBucketFromLatestHistory(bucket.id);
}
```

### File: `src/electron/database/queries/bucketValueHistory.ts`

#### 3.3 Enhanced `adjustBucketValueHistoryForHistoricalTransaction`

```typescript
export async function adjustBucketValueHistoryForHistoricalTransaction(
  bucketId: number,
  transactionDate: string,
  contributedAmountDelta: number,
  marketValueDelta: number,
  unitsDelta: number,  // NEW parameter
  newAvgCostPerUnit: number | null,  // NEW parameter
): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Get all history records AFTER the transaction date
  const { data: futureHistories, error: futureError } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('bucket_id', bucketId)
    .eq('user_id', userId)
    .gt('recorded_at', transactionDate)
    .order('recorded_at', { ascending: true });

  if (futureError) throw new Error(futureError.message);
  if (!futureHistories || futureHistories.length === 0) return;

  let runningTotalUnits = (futureHistories[0].total_units ?? 0) + unitsDelta;
  let runningAvgCostPerUnit = newAvgCostPerUnit ?? futureHistories[0].avg_cost_per_unit;

  for (const history of futureHistories) {
    // Always adjust contributed_amount
    const newContributedAmount = history.contributed_amount + contributedAmountDelta;

    let newMarketValue: number;
    let newTotalUnits: number | null;
    let newHistoryAvgCost: number | null;

    // ============================================
    // HANDLE MARKET VALUE UPDATES
    // ============================================

    if (history.source_type === 'market') {
      // Market update: don't adjust market_value, stop propagating market_value changes
      newMarketValue = history.market_value;
      marketValueDelta = 0;  // Stop propagating

      // Units don't change on market value updates
      newTotalUnits = runningTotalUnits;
      newHistoryAvgCost = runningAvgCostPerUnit;

    // ============================================
    // HANDLE TRANSACTION UPDATES
    // ============================================

    } else {
      // Transaction: adjust market_value and units
      newMarketValue = history.market_value + marketValueDelta;

      // If this history has unit changes, recalculate
      if (history.total_units !== null) {
        const historyUnitsDelta = history.total_units - (runningTotalUnits ?? 0);
        runningTotalUnits = (runningTotalUnits ?? 0) + historyUnitsDelta;

        // Recalculate avg cost if units were added
        if (historyUnitsDelta > 0 && runningTotalUnits > 0) {
          // This transaction added units, recalculate weighted average
          const oldCost = runningAvgCostPerUnit * (runningTotalUnits - historyUnitsDelta);
          const addedCost = (newContributedAmount - (history.contributed_amount - contributedAmountDelta)) + contributedAmountDelta;
          runningAvgCostPerUnit = (oldCost + addedCost) / runningTotalUnits;
        }

        newTotalUnits = runningTotalUnits;
        newHistoryAvgCost = runningAvgCostPerUnit;
      } else {
        newTotalUnits = null;
        newHistoryAvgCost = null;
      }
    }

    // ============================================
    // UPDATE HISTORY RECORD
    // ============================================

    const { error: updateError } = await supabase
      .from('bucket_value_history')
      .update({
        contributed_amount: newContributedAmount,
        market_value: newMarketValue,
        total_units: newTotalUnits,
        avg_cost_per_unit: newHistoryAvgCost,
      })
      .eq('id', history.id);

    if (updateError) throw new Error(updateError.message);
  }
}
```

### File: `src/electron/database/queries/bucket.ts`

#### 3.4 Enhanced `updateBucketFromLatestHistory`

```typescript
export async function updateBucketFromLatestHistory(
  bucketId: number,
): Promise<void> {
  const latestHistory = await getLatestBucketValueHistory(bucketId);

  if (!latestHistory) {
    await updateBucket(bucketId, {
      contributed_amount: 0,
      market_value: 0,
      total_units: null,
      avg_cost_per_unit: null,
    });
    return;
  }

  await updateBucket(bucketId, {
    contributed_amount: latestHistory.contributed_amount,
    market_value: latestHistory.market_value,
    total_units: latestHistory.total_units,
    avg_cost_per_unit: latestHistory.avg_cost_per_unit,
  });
}
```

---

## Phase 4: UI Component Updates

### 4.1 Transaction Modal Enhancement

**File:** `src/ui/features/transaction/components/TransactionModal.tsx`

```typescript
export function TransactionModal({ transactionId, open, onClose }: TransactionModalProps) {
  const [fromBucketId, setFromBucketId] = useState<number | null>(null);
  const [toBucketId, setToBucketId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // NEW: Unit tracking state
  const [fromUnits, setFromUnits] = useState<string>('');
  const [fromPricePerUnit, setFromPricePerUnit] = useState<string>('');
  const [toUnits, setToUnits] = useState<string>('');
  const [toPricePerUnit, setToPricePerUnit] = useState<string>('');

  // Get bucket information
  const { data: fromBucket } = useGetBucketQuery(fromBucketId!, {
    skip: !fromBucketId,
  });
  const { data: toBucket } = useGetBucketQuery(toBucketId!, {
    skip: !toBucketId,
  });

  // Auto-calculate amount when units/price provided
  useEffect(() => {
    if (fromUnits && fromPricePerUnit) {
      const calculated = parseFloat(fromUnits) * parseFloat(fromPricePerUnit);
      setAmount(calculated.toFixed(2));
    } else if (toUnits && toPricePerUnit) {
      const calculated = parseFloat(toUnits) * parseFloat(toPricePerUnit);
      setAmount(calculated.toFixed(2));
    }
  }, [fromUnits, fromPricePerUnit, toUnits, toPricePerUnit]);

  const handleSubmit = async () => {
    await createTransaction({
      from_bucket_id: fromBucketId,
      to_bucket_id: toBucketId,
      amount: parseFloat(amount),
      transaction_date: transactionDate,
      notes,
      from_units: fromUnits ? parseFloat(fromUnits) : null,
      from_price_per_unit: fromPricePerUnit ? parseFloat(fromPricePerUnit) : null,
      to_units: toUnits ? parseFloat(toUnits) : null,
      to_price_per_unit: toPricePerUnit ? parseFloat(toPricePerUnit) : null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Transaction</DialogTitle>
      <DialogContent>
        {/* Bucket Selectors */}
        <BucketSelect
          label="From Bucket"
          value={fromBucketId}
          onChange={setFromBucketId}
        />

        {/* FROM BUCKET UNIT FIELDS (if investment) */}
        {fromBucket?.type === 'investment' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Selling from {fromBucket.name}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Units to Sell"
                  type="number"
                  value={fromUnits}
                  onChange={(e) => setFromUnits(e.target.value)}
                  helperText={fromBucket.total_units ? `Available: ${fromBucket.total_units}` : ''}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Price per Unit"
                  type="number"
                  value={fromPricePerUnit}
                  onChange={(e) => setFromPricePerUnit(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
            {fromBucket.avg_cost_per_unit && fromPricePerUnit && (
              <Typography variant="caption" color={
                parseFloat(fromPricePerUnit) > fromBucket.avg_cost_per_unit ? 'success.main' : 'error.main'
              }>
                Avg Cost: ${fromBucket.avg_cost_per_unit.toFixed(2)} |
                Gain/Loss per unit: ${(parseFloat(fromPricePerUnit) - fromBucket.avg_cost_per_unit).toFixed(2)}
              </Typography>
            )}
          </Box>
        )}

        <BucketSelect
          label="To Bucket"
          value={toBucketId}
          onChange={setToBucketId}
        />

        {/* TO BUCKET UNIT FIELDS (if investment) */}
        {toBucket?.type === 'investment' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Buying for {toBucket.name}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Units to Buy"
                  type="number"
                  value={toUnits}
                  onChange={(e) => setToUnits(e.target.value)}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Price per Unit"
                  type="number"
                  value={toPricePerUnit}
                  onChange={(e) => setToPricePerUnit(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Amount Field */}
        <TextField
          fullWidth
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ mt: 2 }}
          helperText="Auto-calculated from units × price (can override)"
        />

        {/* Date and Notes */}
        <TextField
          fullWidth
          label="Transaction Date"
          type="datetime-local"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          sx={{ mt: 2 }}
        />
        <TextField
          fullWidth
          label="Notes"
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Transaction
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 4.2 Bucket Card Enhancement

**File:** `src/ui/features/bucket/components/BucketCard.tsx`

```typescript
export function BucketCard({ bucket, onClick }: BucketCardProps) {
  // Calculate current price per unit for investments
  const currentPricePerUnit = bucket.total_units && bucket.total_units > 0
    ? bucket.market_value / bucket.total_units
    : null;

  // Calculate unrealized gain/loss per unit
  const gainLossPerUnit = currentPricePerUnit && bucket.avg_cost_per_unit
    ? currentPricePerUnit - bucket.avg_cost_per_unit
    : null;

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick}>
        <CardContent>
          {/* Bucket Name with Type Chip */}
          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1 }}>
            <Typography variant="h3" sx={{ flex: 1 }}>
              {bucket.name}
            </Typography>
            {(bucket.type === 'saving' || bucket.type === 'investment') && (
              <Chip
                label={bucket.type.charAt(0).toUpperCase() + bucket.type.slice(1)}
                size="small"
                variant="outlined"
                color={bucket.type === 'saving' ? 'info' : 'warning'}
              />
            )}
          </Box>

          {/* Investment Bucket - Show Units */}
          {bucket.type === 'investment' && bucket.total_units !== null && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Units
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {bucket.total_units.toFixed(4)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Contributed
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatMoney(bucket.contributed_amount)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Market Value
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatMoney(bucket.market_value)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Current Price/Unit
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {currentPricePerUnit ? formatMoney(currentPricePerUnit) : '-'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Avg Cost/Unit
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {bucket.avg_cost_per_unit ? formatMoney(bucket.avg_cost_per_unit) : '-'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Gain/Loss per Unit
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={gainLossPerUnit && gainLossPerUnit > 0 ? 'success.main' : gainLossPerUnit && gainLossPerUnit < 0 ? 'error.main' : 'text.primary'}
                >
                  {gainLossPerUnit !== null ? formatMoney(gainLossPerUnit) : '-'}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Non-Investment or Investment without Units - Show Traditional */}
          {(bucket.type !== 'investment' || bucket.total_units === null) && bucket.type !== 'expense' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Contributed
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatMoney(bucket.contributed_amount)}
                </Typography>
              </Grid>
              {bucket.type === 'investment' && (
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Market Value
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatMoney(bucket.market_value)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
```

### 4.3 CSV Import Enhancement

**File:** `src/ui/features/transaction/components/CsvImportFlow.tsx`

Add support for unit/price columns:

```typescript
// Column mapping step - add unit fields
const [columnMapping, setColumnMapping] = useState({
  transactionDate: '',
  depositAmount: '',
  withdrawalAmount: '',
  notes: '',
  // NEW: Unit tracking columns
  fromUnits: '',
  fromPricePerUnit: '',
  toUnits: '',
  toPricePerUnit: '',
});

// When processing rows, include unit data
const transactionData = {
  amount: transactionAmount,
  from_bucket_id: isDeposit ? null : selectedBucket.id,
  to_bucket_id: isDeposit ? selectedBucket.id : null,
  transaction_date: transactionDate,
  notes: row[columnMapping.notes] || '',
  // NEW: Include units if columns mapped
  from_units: !isDeposit && columnMapping.fromUnits
    ? parseFloat(row[columnMapping.fromUnits] || '0')
    : null,
  from_price_per_unit: !isDeposit && columnMapping.fromPricePerUnit
    ? parseFloat(row[columnMapping.fromPricePerUnit] || '0')
    : null,
  to_units: isDeposit && columnMapping.toUnits
    ? parseFloat(row[columnMapping.toUnits] || '0')
    : null,
  to_price_per_unit: isDeposit && columnMapping.toPricePerUnit
    ? parseFloat(row[columnMapping.toPricePerUnit] || '0')
    : null,
};
```

---

## Phase 5: Manual Unit Adjustment Feature

### New Component: `AdjustUnitsModal.tsx`

**File:** `src/ui/features/bucket/components/AdjustUnitsModal.tsx`

```typescript
interface AdjustUnitsModalProps {
  bucket: Bucket;
  open: boolean;
  onClose: () => void;
}

export function AdjustUnitsModal({ bucket, open, onClose }: AdjustUnitsModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('set');
  const [units, setUnits] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [createTransaction] = useCreateTransactionMutation();

  const handleSubmit = async () => {
    let newTotalUnits: number;

    switch (adjustmentType) {
      case 'add':
        newTotalUnits = (bucket.total_units ?? 0) + parseFloat(units);
        break;
      case 'remove':
        newTotalUnits = (bucket.total_units ?? 0) - parseFloat(units);
        break;
      case 'set':
        newTotalUnits = parseFloat(units);
        break;
    }

    const unitsDelta = newTotalUnits - (bucket.total_units ?? 0);

    // Create a special "self-transaction" to adjust units
    await createTransaction({
      from_bucket_id: bucket.id,
      to_bucket_id: bucket.id,
      amount: 0,  // No money movement
      from_units: unitsDelta < 0 ? Math.abs(unitsDelta) : 0,
      from_price_per_unit: bucket.avg_cost_per_unit ?? 0,
      to_units: unitsDelta > 0 ? unitsDelta : 0,
      to_price_per_unit: bucket.avg_cost_per_unit ?? 0,
      notes: `Unit adjustment: ${reason}`,
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Adjust Units for {bucket.name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current Units: {bucket.total_units?.toFixed(4) ?? '0'}
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Adjustment Type</FormLabel>
          <RadioGroup
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value as any)}
          >
            <FormControlLabel value="add" control={<Radio />} label="Add Units" />
            <FormControlLabel value="remove" control={<Radio />} label="Remove Units" />
            <FormControlLabel value="set" control={<Radio />} label="Set Total Units" />
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          label={adjustmentType === 'set' ? 'New Total Units' : 'Units'}
          type="number"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Reason (Optional)"
          placeholder="e.g., 2-for-1 stock split, correction"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={2}
        />

        {adjustmentType !== 'set' && units && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            New Total: {(
              adjustmentType === 'add'
                ? (bucket.total_units ?? 0) + parseFloat(units)
                : (bucket.total_units ?? 0) - parseFloat(units)
            ).toFixed(4)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Adjust Units
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Add Button to BucketModal

Add "Adjust Units" button in the bucket modal for investment buckets.

---

## Phase 6: Implementation Roadmap

### Step 1: Database Migration (Week 1)
- [ ] Create `003_investment_units_tracking.sql`
- [ ] Test migration on development database
- [ ] Verify nullable fields work correctly
- [ ] Rollback plan: All fields nullable, can be dropped if needed

### Step 2: Type Definitions (Week 1)
- [ ] Update `types.d.ts` with unit fields
- [ ] Update validation schemas
- [ ] Update IPC type mappings
- [ ] Run TypeScript compiler to find affected areas

### Step 3: Backend Core Logic (Week 2-3)
- [ ] Implement `updateBucketForTransaction` helper
- [ ] Update `createTransaction` with unit handling
- [ ] Update `updateTransaction` with unit handling
- [ ] Implement average cost basis calculation
- [ ] Update `adjustBucketValueHistoryForHistoricalTransaction`
- [ ] Update `updateBucketFromLatestHistory`
- [ ] Write unit tests for:
  - [ ] Average cost calculation
  - [ ] Buy transactions
  - [ ] Sell transactions
  - [ ] Investment-to-investment transactions
  - [ ] Historical adjustments with units

### Step 4: Transaction Modal UI (Week 3)
- [ ] Add unit/price input fields
- [ ] Implement conditional rendering (investment buckets only)
- [ ] Add auto-calculation of amount
- [ ] Show available units when selling
- [ ] Show gain/loss preview when selling
- [ ] Test all transaction types

### Step 5: Bucket Display (Week 4)
- [ ] Update `BucketCard` with unit display
- [ ] Calculate and show current price per unit
- [ ] Show gain/loss per unit
- [ ] Update `BucketModal` with unit history
- [ ] Show realized gains on past transactions

### Step 6: Advanced Features (Week 5)
- [ ] Implement `AdjustUnitsModal`
- [ ] Add CSV import unit support
- [ ] Add unit column mapping
- [ ] Test stock split scenarios

### Step 7: Testing & Refinement (Week 6)
- [ ] End-to-end testing all scenarios
- [ ] Backward compatibility testing
- [ ] Historical transaction adjustment testing
- [ ] Performance testing with large datasets
- [ ] UI/UX refinements
- [ ] Documentation updates

---

## Example Scenarios

### Scenario 1: Initial Investment Purchase

**User Action:** Buy 10 shares of Apple stock for $1000

```
Transaction:
{
  from_bucket_id: 5,  // Cash/Saving bucket
  to_bucket_id: 10,   // Apple Stock bucket (investment)
  amount: 1000,
  to_units: 10,
  to_price_per_unit: 100,
}

Result - Cash Bucket:
{
  contributed_amount: 5000 → 4000,
  market_value: 5000 → 4000,
  total_units: null,
  avg_cost_per_unit: null,
}

Result - Apple Stock Bucket:
{
  contributed_amount: 0 → 1000,
  market_value: 0 → 1000,
  total_units: 0 → 10,
  avg_cost_per_unit: 0 → 100,
}

History Record Created:
{
  bucket_id: 10,
  contributed_amount: 1000,
  market_value: 1000,
  total_units: 10,
  avg_cost_per_unit: 100,
  source_type: 'transaction',
}
```

### Scenario 2: Subsequent Purchase (Average Cost)

**User Action:** Buy 5 more shares of Apple at $120

```
Transaction:
{
  from_bucket_id: 5,  // Cash
  to_bucket_id: 10,   // Apple Stock
  amount: 600,
  to_units: 5,
  to_price_per_unit: 120,
}

Average Cost Calculation:
old_total = 10 units @ $100 = $1000
new_purchase = 5 units @ $120 = $600
new_total = 15 units
new_avg_cost = ($1000 + $600) / 15 = $106.67

Result - Apple Stock Bucket:
{
  contributed_amount: 1000 → 1600,
  market_value: 1000 → 1600,
  total_units: 10 → 15,
  avg_cost_per_unit: 100 → 106.67,
}
```

### Scenario 3: Partial Sale with Gain

**User Action:** Sell 5 shares of Apple at $150

```
Transaction:
{
  from_bucket_id: 10,  // Apple Stock
  to_bucket_id: 5,     // Cash
  amount: 750,
  from_units: 5,
  from_price_per_unit: 150,
}

Realized Gain Calculation:
Sale price: 5 × $150 = $750
Cost basis: 5 × $106.67 = $533.35
Realized gain: $750 - $533.35 = $216.65

Result - Apple Stock Bucket:
{
  contributed_amount: 1600 → 1066.65,  // Remove cost basis
  market_value: 1600 → 850,             // Remove sale proceeds (before accounting for gain)
  total_units: 15 → 10,
  avg_cost_per_unit: 106.67 (unchanged),
}

Note: Market value calculation
Old market value: 1600
Remove sold shares at sale price: 5 × 150 = 750
New market value: 1600 - 750 = 850

Result - Cash Bucket:
{
  contributed_amount: +750,
  market_value: +750,
}
```

### Scenario 4: Market Value Update

**User Action:** Update market value to reflect current price of $160/share

```
Manual Update:
{
  bucket_id: 10,
  new_market_value: 1600,  // 10 shares × $160
}

Result - Apple Stock Bucket:
{
  contributed_amount: 1066.65 (unchanged),
  market_value: 850 → 1600,
  total_units: 10 (unchanged),
  avg_cost_per_unit: 106.67 (unchanged),
}

Current price per unit (derived):
$1600 / 10 = $160

Unrealized gain per unit:
$160 - $106.67 = $53.33

Total unrealized gain:
$53.33 × 10 = $533.30
```

### Scenario 5: Rebalancing (Investment to Investment)

**User Action:** Sell 5 shares of Apple ($160) to buy 8 shares of Tesla ($100)

```
Transaction:
{
  from_bucket_id: 10,  // Apple Stock
  to_bucket_id: 11,    // Tesla Stock
  amount: 800,
  from_units: 5,
  from_price_per_unit: 160,
  to_units: 8,
  to_price_per_unit: 100,
}

Result - Apple Stock:
{
  contributed_amount: 1066.65 → 533.32,
  market_value: 1600 → 800,
  total_units: 10 → 5,
  avg_cost_per_unit: 106.67 (unchanged),
}

Result - Tesla Stock:
{
  contributed_amount: 0 → 800,
  market_value: 0 → 800,
  total_units: 0 → 8,
  avg_cost_per_unit: 0 → 100,
}
```

### Scenario 6: Stock Split (2-for-1)

**User Action:** Adjust units for 2-for-1 stock split

```
Before Split:
{
  total_units: 5,
  avg_cost_per_unit: 106.67,
  market_value: 800,
}

Split Adjustment (using AdjustUnitsModal):
{
  adjustment_type: 'set',
  new_total_units: 10,  // Double the units
  reason: '2-for-1 stock split',
}

After Split:
{
  total_units: 5 → 10,
  avg_cost_per_unit: 106.67 → 53.34,  // Half the cost
  market_value: 800 (unchanged),
  contributed_amount: 533.32 (unchanged),
}

Current price per unit (derived):
$800 / 10 = $80 (was $160 before split)
```

---

## Success Criteria Checklist

### Core Functionality
- [ ] Investment buckets can track units and price per unit
- [ ] Average cost basis calculated correctly on purchases
- [ ] Average cost basis maintained correctly on sales
- [ ] Realized gains calculated correctly on sales
- [ ] Unrealized gains displayed correctly in UI
- [ ] Market value updates don't affect unit counts
- [ ] Market value updates don't affect average cost basis

### Transaction Types
- [ ] Cash → Investment (buy)
- [ ] Investment → Cash (sell)
- [ ] Investment → Investment (rebalance)
- [ ] Investment → Expense (sell and spend)
- [ ] Saving → Investment (move cash to investment)
- [ ] Investment transactions without units (backward compatible)

### Historical Adjustments
- [ ] Adding historical investment transaction updates future units
- [ ] Adding historical investment transaction recalculates future avg cost
- [ ] Deleting investment transaction adjusts future records correctly
- [ ] Updating investment transaction recalculates correctly

### UI/UX
- [ ] Unit fields appear only for investment buckets
- [ ] Amount auto-calculated from units × price
- [ ] Available units shown when selling
- [ ] Gain/loss preview shown when selling
- [ ] Bucket card shows all unit metrics correctly
- [ ] Current price per unit calculated correctly
- [ ] CSV import supports unit columns

### Edge Cases
- [ ] Selling more units than available (validation error)
- [ ] Zero units remaining after sale
- [ ] Negative average cost (should be impossible)
- [ ] Stock splits handled correctly
- [ ] Manual unit adjustments work correctly
- [ ] Mixed unit/non-unit transactions in same bucket

### Backward Compatibility
- [ ] Existing transactions continue to work
- [ ] Non-investment buckets unaffected
- [ ] Buckets without units work as before
- [ ] CSV imports without unit columns work
- [ ] Market value updates work for both unit and non-unit investments

### Performance
- [ ] Large transaction histories load quickly
- [ ] Historical adjustments perform acceptably
- [ ] Unit calculations don't slow down UI

---

## Risk Mitigation

### Risk: Data Migration Issues
**Mitigation:**
- All new fields are nullable
- Existing data unaffected
- Can rollback by dropping columns

### Risk: Average Cost Calculation Errors
**Mitigation:**
- Extensive unit testing
- Manual verification with known scenarios
- Logging of all cost basis changes

### Risk: Historical Adjustment Performance
**Mitigation:**
- Batch update operations
- Optimize queries with proper indexing
- Monitor performance metrics

### Risk: UI Complexity
**Mitigation:**
- Progressive disclosure (show unit fields only when needed)
- Clear help text and tooltips
- Provide example scenarios in documentation

### Risk: User Confusion
**Mitigation:**
- Tooltips explaining calculations
- Example transactions in help documentation
- Gradual rollout with user feedback

---

## Future Enhancements (Out of Scope)

These features are intentionally NOT included in the initial implementation:

- ❌ Transaction fees tracking
- ❌ Dividend/interest special handling
- ❌ FIFO or specific lot identification
- ❌ Multi-currency support
- ❌ Real-time price integration
- ❌ Tax lot tracking for tax purposes
- ❌ Multiple securities per bucket
- ❌ Automatic split detection
- ❌ Performance charts comparing holdings

These can be added in future iterations based on user feedback and demand.

---

## Conclusion

This implementation plan provides a comprehensive approach to adding unit-based investment tracking while maintaining full backward compatibility with the existing system. The phased approach allows for iterative development and testing, reducing risk and ensuring a smooth rollout.

The key innovation is using separate `from_*` and `to_*` unit fields, which enables flexible investment-to-investment transactions while keeping the system simple for non-investment buckets.

By leveraging the existing bucket value history system and average cost basis calculation, the feature integrates naturally with the current architecture without requiring major refactoring.
