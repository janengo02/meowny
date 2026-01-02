import { Box, Drawer, Divider, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { BucketCategorySelect } from './BucketCategorySelect';
import { useGetBucketQuery } from '../api/bucketApi';
import { useAppSelector } from '../../../store/hooks';
import {
  selectAccountById,
  selectBucketById,
} from '../../account/selectors/accountSelectors';
import { BucketGoal } from './BucketGoal';
import { BucketSummary } from './BucketSummary';
import { BucketTitle } from './BucketTitle';
import { BucketModalFooter } from './BucketModalFooter';
import { BucketPerformance } from './BucketPerformance';
import { BucketVisibilityToggle } from './BucketVisibilityToggle';
import { getColorConfig } from '../../../shared/theme/colors';

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

  // Get the account for this bucket
  const account = useAppSelector((state) =>
    bucket?.account_id ? selectAccountById(state, bucket.account_id) : null,
  );

  if (!bucketId || !bucket) return null;
  const accountColorConfig = account?.color
    ? getColorConfig(account?.color)
    : null;

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
              '&:hover': {
                transform: 'translate(-1px, -1px)',
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
              },
            }}
          />
          {account && (
            <Chip
              label={account.name}
              size="medium"
              sx={{
                transition: 'all 0.15s ease',
                '&:hover': {
                  transform: 'translate(-1px, -1px)',
                  boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
                },
                ...(accountColorConfig && {
                  backgroundColor: `${accountColorConfig.bgColor} !important`,
                  color: accountColorConfig.color
                    ? accountColorConfig.color
                    : undefined,
                }),
              }}
              variant="outlined"
            />
          )}

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
