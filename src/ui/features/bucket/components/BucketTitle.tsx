import { TextField } from '@mui/material';
import { useUpdateBucketMutation } from '../api/bucketApi';

interface BucketTitleProps {
  bucket: Bucket;
}
export function BucketTitle({ bucket }: BucketTitleProps) {
  const [updateBucket] = useUpdateBucketMutation();
  const handleNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (bucket) {
      const trimmedName = e.target.value.trim();
      if (!trimmedName) {
        // Reset to original name if empty
        e.target.value = bucket.name;
      } else if (trimmedName !== bucket.name) {
        // Update if name changed
        await updateBucket({
          id: bucket.id,
          params: { name: trimmedName },
        });
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };
  return (
    <TextField
      key={bucket.id}
      defaultValue={bucket.name}
      onBlur={handleNameBlur}
      onKeyDown={handleNameKeyDown}
      variant="standard"
      fullWidth
      slotProps={{
        input: {
          disableUnderline: true,
          sx: {
            fontSize: '1.5rem',
            fontWeight: 500,
            padding: 0,
            '&:before': {
              display: 'none',
            },
            '&:after': {
              display: 'none',
            },
          },
        },
      }}
      sx={{
        mr: 2,
        '& .MuiInputBase-root': {
          '&:before': {
            display: 'none',
          },
          '&:after': {
            display: 'none',
          },
        },
      }}
    />
  );
}
