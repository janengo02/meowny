import { describe, it, expect } from 'vitest';
import { calculateBucketUpdate } from './bucketValueHistoryUtils.js';

describe('calculateBucketUpdate', () => {
  describe('with existing history', () => {
    const mockLastHistory: BucketValueHistory = {
      id: 1,
      user_id: 'test-user-123',
      bucket_id: 1,
      contributed_amount: 1000,
      market_value: 1100,
      total_units: 50,
      recorded_at: '2024-06-14T10:00:00.000Z',
      source_type: 'transaction',
      source_id: 1,
      notes: null,
      created_at: '2024-06-14T10:00:00.000Z',
      updated_at: '2024-06-14T10:00:00.000Z',
      contributed_amount_delta: 1000,
      market_value_delta: 1000,
      total_units_delta: 50,
    };

    it('should add positive amount delta to contributed and market amounts', () => {
      const result = calculateBucketUpdate(mockLastHistory, 500, null);

      expect(result.newContributedAmount).toBe(1500);
      expect(result.newMarketAmount).toBe(1600);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should subtract negative amount delta from contributed and market amounts', () => {
      const result = calculateBucketUpdate(mockLastHistory, -300, null);

      expect(result.newContributedAmount).toBe(700);
      expect(result.newMarketAmount).toBe(800);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should add positive units delta to total units', () => {
      const result = calculateBucketUpdate(mockLastHistory, 500, 25);

      expect(result.newContributedAmount).toBe(1500);
      expect(result.newMarketAmount).toBe(1600);
      expect(result.newTotalUnits).toBe(75);
    });

    it('should subtract negative units delta from total units', () => {
      const result = calculateBucketUpdate(mockLastHistory, -200, -10);

      expect(result.newContributedAmount).toBe(800);
      expect(result.newMarketAmount).toBe(900);
      expect(result.newTotalUnits).toBe(40);
    });

    it('should handle zero amount delta', () => {
      const result = calculateBucketUpdate(mockLastHistory, 0, null);

      expect(result.newContributedAmount).toBe(1000);
      expect(result.newMarketAmount).toBe(1100);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should handle zero units delta', () => {
      const result = calculateBucketUpdate(mockLastHistory, 100, 0);

      expect(result.newContributedAmount).toBe(1100);
      expect(result.newMarketAmount).toBe(1200);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should zero out amounts when selling all units (units become 0)', () => {
      const result = calculateBucketUpdate(mockLastHistory, -1000, -50);

      expect(result.newContributedAmount).toBe(0);
      expect(result.newMarketAmount).toBe(0);
      expect(result.newTotalUnits).toBe(0);
    });

    it('should not zero out amounts when units delta is null even if amounts reach zero', () => {
      const result = calculateBucketUpdate(mockLastHistory, -1100, null);

      expect(result.newContributedAmount).toBe(-100);
      expect(result.newMarketAmount).toBe(0);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should handle fractional amount deltas', () => {
      const result = calculateBucketUpdate(mockLastHistory, 123.45, null);

      expect(result.newContributedAmount).toBe(1123.45);
      expect(result.newMarketAmount).toBe(1223.45);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should handle fractional units deltas', () => {
      const result = calculateBucketUpdate(mockLastHistory, 250, 12.5);

      expect(result.newContributedAmount).toBe(1250);
      expect(result.newMarketAmount).toBe(1350);
      expect(result.newTotalUnits).toBe(62.5);
    });
  });

  describe('without existing history (null)', () => {
    it('should start from zero when lastHistory is null with positive deltas', () => {
      const result = calculateBucketUpdate(null, 1000, null);

      expect(result.newContributedAmount).toBe(1000);
      expect(result.newMarketAmount).toBe(1000);
      expect(result.newTotalUnits).toBeNull();
    });

    it('should start from zero with units delta', () => {
      const result = calculateBucketUpdate(null, 1000, 50);

      expect(result.newContributedAmount).toBe(1000);
      expect(result.newMarketAmount).toBe(1000);
      expect(result.newTotalUnits).toBe(50);
    });

    it('should handle negative deltas from zero', () => {
      const result = calculateBucketUpdate(null, -500, null);

      expect(result.newContributedAmount).toBe(-500);
      expect(result.newMarketAmount).toBe(-500);
      expect(result.newTotalUnits).toBeNull();
    });

    it('should zero out amounts when units reach zero from null history', () => {
      const result = calculateBucketUpdate(null, 1000, 0);

      expect(result.newContributedAmount).toBe(0);
      expect(result.newMarketAmount).toBe(0);
      expect(result.newTotalUnits).toBe(0);
    });

    it('should handle zero deltas from null history', () => {
      const result = calculateBucketUpdate(null, 0, null);

      expect(result.newContributedAmount).toBe(0);
      expect(result.newMarketAmount).toBe(0);
      expect(result.newTotalUnits).toBeNull();
    });
  });

  describe('with history that has no units', () => {
    const mockHistoryNoUnits: BucketValueHistory = {
      id: 2,
      user_id: 'test-user-123',
      bucket_id: 2,
      contributed_amount: 2000,
      market_value: 2000,
      total_units: null,
      recorded_at: '2024-06-14T10:00:00.000Z',
      source_type: 'transaction',
      source_id: 2,
      notes: null,
      created_at: '2024-06-14T10:00:00.000Z',
      updated_at: '2024-06-14T10:00:00.000Z',
      contributed_amount_delta: 2000,
      market_value_delta: 2000,
      total_units_delta: null,
    };

    it('should handle amount changes without units tracking', () => {
      const result = calculateBucketUpdate(mockHistoryNoUnits, 500, null);

      expect(result.newContributedAmount).toBe(2500);
      expect(result.newMarketAmount).toBe(2500);
      expect(result.newTotalUnits).toBeNull();
    });

    it('should initialize units when unitsDelta is provided for the first time', () => {
      const result = calculateBucketUpdate(mockHistoryNoUnits, 1000, 100);

      expect(result.newContributedAmount).toBe(3000);
      expect(result.newMarketAmount).toBe(3000);
      expect(result.newTotalUnits).toBe(100);
    });
  });

  describe('edge cases', () => {
    const mockHistory: BucketValueHistory = {
      id: 1,
      user_id: 'test-user-123',
      bucket_id: 1,
      contributed_amount: 1000,
      market_value: 1200,
      total_units: 100,
      recorded_at: '2024-06-14T10:00:00.000Z',
      source_type: 'transaction',
      source_id: 1,
      notes: null,
      created_at: '2024-06-14T10:00:00.000Z',
      updated_at: '2024-06-14T10:00:00.000Z',
      contributed_amount_delta: 1000,
      market_value_delta: 1000,
      total_units_delta: 100,
    };

    it('should handle very large amounts', () => {
      const result = calculateBucketUpdate(mockHistory, 1000000, null);

      expect(result.newContributedAmount).toBe(1001000);
      expect(result.newMarketAmount).toBe(1001200);
      expect(result.newTotalUnits).toBe(100);
    });

    it('should handle very small fractional amounts', () => {
      const result = calculateBucketUpdate(mockHistory, 0.01, 0.001);

      expect(result.newContributedAmount).toBe(1000.01);
      expect(result.newMarketAmount).toBe(1200.01);
      expect(result.newTotalUnits).toBe(100.001);
    });

    it('should zero out amounts only when units reach exactly 0, not negative', () => {
      const result = calculateBucketUpdate(mockHistory, -500, -100);

      expect(result.newContributedAmount).toBe(0);
      expect(result.newMarketAmount).toBe(0);
      expect(result.newTotalUnits).toBe(0);
    });

    it('should allow negative units but not zero out amounts', () => {
      const result = calculateBucketUpdate(mockHistory, -500, -110);

      expect(result.newContributedAmount).toBe(500);
      expect(result.newMarketAmount).toBe(700);
      expect(result.newTotalUnits).toBe(-10);
    });

    it('should handle transition from units to no units tracking', () => {
      const result = calculateBucketUpdate(mockHistory, 500, null);

      expect(result.newContributedAmount).toBe(1500);
      expect(result.newMarketAmount).toBe(1700);
      expect(result.newTotalUnits).toBe(100);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle buying investment with units', () => {
      const lastHistory: BucketValueHistory = {
        id: 1,
        user_id: 'user-1',
        bucket_id: 1,
        contributed_amount: 5000,
        market_value: 5500,
        total_units: 100,
        recorded_at: '2024-01-01T00:00:00.000Z',
        source_type: 'transaction',
        source_id: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        contributed_amount_delta: 5000,
        market_value_delta: 5000,
        total_units_delta: 100,
      };

      // Buying $2000 worth of investment (40 units at $50/unit)
      const result = calculateBucketUpdate(lastHistory, 2000, 40);

      expect(result.newContributedAmount).toBe(7000);
      expect(result.newMarketAmount).toBe(7500);
      expect(result.newTotalUnits).toBe(140);
    });

    it('should handle selling partial investment units', () => {
      const lastHistory: BucketValueHistory = {
        id: 1,
        user_id: 'user-1',
        bucket_id: 1,
        contributed_amount: 5000,
        market_value: 5500,
        total_units: 100,
        recorded_at: '2024-01-01T00:00:00.000Z',
        source_type: 'transaction',
        source_id: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        contributed_amount_delta: 5000,
        market_value_delta: 5000,
        total_units_delta: 100,
      };

      // Selling 30 units at $60/unit = -$1800
      const result = calculateBucketUpdate(lastHistory, -1800, -30);

      expect(result.newContributedAmount).toBe(3200);
      expect(result.newMarketAmount).toBe(3700);
      expect(result.newTotalUnits).toBe(70);
    });

    it('should handle closing entire investment position', () => {
      const lastHistory: BucketValueHistory = {
        id: 1,
        user_id: 'user-1',
        bucket_id: 1,
        contributed_amount: 5000,
        market_value: 5500,
        total_units: 100,
        recorded_at: '2024-01-01T00:00:00.000Z',
        source_type: 'transaction',
        source_id: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        contributed_amount_delta: 5000,
        market_value_delta: 5000,
        total_units_delta: 100,
      };

      // Selling all 100 units at $55/unit = -$5500
      const result = calculateBucketUpdate(lastHistory, -5500, -100);

      // When all units are sold, amounts should be zeroed
      expect(result.newContributedAmount).toBe(0);
      expect(result.newMarketAmount).toBe(0);
      expect(result.newTotalUnits).toBe(0);
    });

    it('should handle regular savings account deposit (no units)', () => {
      const lastHistory: BucketValueHistory = {
        id: 1,
        user_id: 'user-1',
        bucket_id: 2,
        contributed_amount: 10000,
        market_value: 10000,
        total_units: null,
        recorded_at: '2024-01-01T00:00:00.000Z',
        source_type: 'transaction',
        source_id: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        contributed_amount_delta: 10000,
        market_value_delta: 10000,
        total_units_delta: null,
      };

      // Depositing $500
      const result = calculateBucketUpdate(lastHistory, 500, null);

      expect(result.newContributedAmount).toBe(10500);
      expect(result.newMarketAmount).toBe(10500);
      expect(result.newTotalUnits).toBeNull();
    });

    it('should handle regular savings account withdrawal (no units)', () => {
      const lastHistory: BucketValueHistory = {
        id: 1,
        user_id: 'user-1',
        bucket_id: 2,
        contributed_amount: 10000,
        market_value: 10000,
        total_units: null,
        recorded_at: '2024-01-01T00:00:00.000Z',
        source_type: 'transaction',
        source_id: 1,
        notes: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        contributed_amount_delta: 10000,
        market_value_delta: 10000,
        total_units_delta: null,
      };

      // Withdrawing $3000
      const result = calculateBucketUpdate(lastHistory, -3000, null);

      expect(result.newContributedAmount).toBe(7000);
      expect(result.newMarketAmount).toBe(7000);
      expect(result.newTotalUnits).toBeNull();
    });
  });
});
