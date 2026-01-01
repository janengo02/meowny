import { Box, Drawer, Divider, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { BucketCategorySelect } from './BucketCategorySelect';
import { useGetBucketQuery } from '../api/bucketApi';
import { useAppSelector } from '../../../store/hooks';
import { selectAccountById } from '../../account/selectors/accountSelectors';
import { BucketGoal } from './BucketGoal';
import { BucketSummary } from './BucketSummary';
import { BucketTitle } from './BucketTitle';
import { BucketModalFooter } from './BucketModalFooter';
import { BucketPerformance } from './BucketPerformance';
import { BucketVisibilityToggle } from './BucketVisibilityToggle';

interface BucketModalProps {
  bucketId: number | null;
  open: boolean;
  onClose: () => void;
}

export function BucketModal({ bucketId, open, onClose }: BucketModalProps) {
  // Get bucket from API
  const { data: bucket } = useGetBucketQuery(bucketId ?? 0, {
    skip: !bucketId,
  });

  // Get the account for this bucket
  const account = useAppSelector((state) =>
    bucket?.account_id ? selectAccountById(state, bucket.account_id) : null,
  );

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

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {bucket.type !== 'expense' && account && (
            <Chip
              label={account.name}
              size="medium"
              sx={{
                borderColor: account.color,
                color: account.color,
              }}
              variant="outlined"
            />
          )}
          <Chip
            label={bucket.type}
            size="medium"
            variant="outlined"
            color={
              bucket.type === 'saving'
                ? 'primary'
                : bucket.type === 'investment'
                  ? 'warning'
                  : 'default'
            }
            sx={{
              textTransform: 'capitalize',
            }}
          />

          <BucketCategorySelect
            bucketId={bucket.id}
            value={bucket.bucket_category_id}
          />
          <Box sx={{ ml: 'auto' }}>
            <BucketVisibilityToggle
              bucketId={bucket.id}
              isHidden={bucket.is_hidden}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {/* Summary Stats */}
        <BucketSummary bucket={bucket} />
        {/* Bucket Goal Section */}
        <Divider sx={{ my: 2 }} />
        <BucketGoal bucketId={bucketId} />
        {/* Graph Section */}
        <Divider sx={{ my: 2 }} />
        <BucketPerformance bucket={bucket} />
        <BucketModalFooter bucket={bucket} onClose={onClose} />
      </Box>
    </Drawer>
  );
}
