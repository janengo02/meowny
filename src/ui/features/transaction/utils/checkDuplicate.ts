// Check if a transaction is a duplicate using the API
export const checkDuplicate = async (
  transactionDate: string,
  amount: number,
  fromBucketId: number | null,
  toBucketId: number | null,
  notes: string | null,
  fromUnits?: number | null,
  toUnits?: number | null,
): Promise<boolean> => {
  try {
    const isDuplicate = await window.electron.checkDuplicateTransaction({
      transaction_date: transactionDate,
      amount: amount,
      from_bucket_id: fromBucketId,
      to_bucket_id: toBucketId,
      notes: notes,
      from_units: fromUnits,
      to_units: toUnits,
    });
    return isDuplicate;
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    return false;
  }
};
