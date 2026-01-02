import { Box, Drawer, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useGetBucketQuery } from '../api/bucketApi';
import { useAppSelector } from '../../../store/hooks';
import { selectBucketById } from '../../account/selectors/accountSelectors';
import { BucketGoal } from './BucketGoal';
import { BucketSummary } from './BucketSummary';
import { BucketTitle } from './BucketTitle';
import { BucketModalFooter } from './BucketModalFooter';
import { BucketPerformance } from './BucketPerformance';
import { BucketModalActions } from './BucketModalActions';

interface BucketModalProps {
  bucketId: number | null;
  open: boolean;
  onClose: () => void;
}

export function BucketModal({ bucketId, open, onClose }: BucketModalProps) {
  // First check if bucket exists in Redux store
  const bucketFromStore = useAppSelector((state) =>
    bucketId ? selectBucketById(state, bucketId) : null,
  );

  // Only fetch from API if bucket is not in store
  const { data: bucketFromApi } = useGetBucketQuery(bucketId ?? 0, {
    skip: !bucketId || !!bucketFromStore,
  });

  // Use store data if available, otherwise use API data
  const bucket = bucketFromStore || bucketFromApi;

  if (!bucketId || !bucket) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true,
        disableScrollLock: true,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: '60%' },
          bgcolor: 'background.default',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <BucketTitle bucket={bucket} />
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <BucketModalActions bucket={bucket} />
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {/* Summary Stats */}
        {bucket.type !== 'expense' && (
          <>
            <BucketSummary bucket={bucket} />
            <Divider sx={{ my: 2 }} />
          </>
        )}
        {/* Bucket Goal Section */}
        <BucketGoal bucketId={bucketId} />
        {/* Graph Section */}
        <Divider sx={{ my: 2 }} />
        <BucketPerformance bucket={bucket} />
        <BucketModalFooter bucket={bucket} onClose={onClose} />
      </Box>
    </Drawer>
  );
}
