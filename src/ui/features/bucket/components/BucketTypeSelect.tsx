import { ChipSelect } from '../../../shared/components/ChipSelect';
import { useUpdateBucketMutation } from '../api/bucketApi';

const BUCKET_TYPES: BucketTypeEnum[] = ['expense', 'saving', 'investment'];

interface BucketTypeSelectProps {
  bucketId: number;
  value: BucketTypeEnum;
  disabled?: boolean;
}

export function BucketTypeSelect({
  bucketId,
  value,
  disabled = false,
}: BucketTypeSelectProps) {
  const [updateBucket, { isLoading }] = useUpdateBucketMutation();

  const handleChange = async (newType: BucketTypeEnum) => {
    try {
      await updateBucket({
        id: bucketId,
        params: { type: newType },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update bucket type:', error);
    }
  };

  return (
    <ChipSelect
      value={value}
      options={BUCKET_TYPES}
      onChange={handleChange}
      disabled={disabled || isLoading}
    />
  );
}
