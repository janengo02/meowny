import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';

interface AddBucketCardProps {
  account: Account;
}

export function AddBucketCard({ account }: AddBucketCardProps) {
  const [createBucket] = useCreateBucketMutation();
  const { setError } = useDashboardError();
  const handleCreateBucket = async () => {
    try {
      await createBucket({
        name: `New ${account.type.charAt(0).toUpperCase() + account.type.slice(1)} Bucket`,
        type: account.type,
        notes: '',
        account_id: account.id,
      }).unwrap();
    } catch {
      setError('Failed to create bucket. Please try again.');
    }
  };
  return (
    <Card
      sx={{
        height: '100%',
        width: '100%',
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea onClick={handleCreateBucket} sx={{ flex: 1 }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 2,
            pr: 1,
            pl: 0,
          }}
        >
          <AddIcon sx={{ color: 'text.secondary' }} />
          <Typography color="text.secondary" variant="body2">
            Add Bucket
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
