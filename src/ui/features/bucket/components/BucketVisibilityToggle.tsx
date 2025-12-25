import { FormControlLabel, Switch } from '@mui/material';
import { useUpdateBucketMutation } from '../api/bucketApi';

interface BucketVisibilityToggleProps {
  bucketId: number;
  isHidden: boolean;
}

export function BucketVisibilityToggle({
  bucketId,
  isHidden,
}: BucketVisibilityToggleProps) {
  const [updateBucket] = useUpdateBucketMutation();

  const handleToggleHidden = async () => {
    try {
      await updateBucket({
        id: bucketId,
        params: { is_hidden: !isHidden },
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle bucket visibility:', error);
    }
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={!isHidden}
          onChange={handleToggleHidden}
          size="small"
        />
      }
      label="Show on Dashboard"
      labelPlacement="start"
    />
  );
}
