import { ChipSelect } from '../../../shared/components/form/ChipSelect';
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

  const handleChange = async (newType: BucketTypeEnum | null) => {
    if (!newType) return; // Don't allow clearing bucket type
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
      options={BUCKET_TYPES.map((type) => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
      }))}
      onChange={handleChange}
      disabled={disabled || isLoading}
    />
  );
}
