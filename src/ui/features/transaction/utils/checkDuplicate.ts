// Check if a transaction is a duplicate using the API
export const checkDuplicate = async (
  transactionDate: string,
  amount: number,
  fromBucketId: number | null,
  toBucketId: number | null,
  notes: string | null,
): Promise<boolean> => {
  try {
    const isDuplicate = await window.electron.checkDuplicateTransaction({
      transaction_date: transactionDate,
      amount: amount,
      from_bucket_id: fromBucketId,
      to_bucket_id: toBucketId,
      notes: notes,
    });
    return isDuplicate;
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    return false;
  }
};
