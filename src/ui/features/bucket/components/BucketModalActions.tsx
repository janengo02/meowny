import { Box, Chip, Button, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useState } from 'react';

import { BucketCategorySelect } from './BucketCategorySelect';
import { useAppSelector } from '../../../store/hooks';
import { selectAccountById } from '../../account/selectors/accountSelectors';
import { TransactionModal } from '../../transaction/components/TransactionModal';
import { MarketValueModal } from './MarketValueModal';

import { getColorConfig } from '../../../shared/theme/colors';

interface BucketModalActionsProps {
  bucket: Bucket;
}

export function BucketModalActions({ bucket }: BucketModalActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [marketValueModalOpen, setMarketValueModalOpen] = useState(false);

  // Get the account for this bucket
  const account = useAppSelector((state) =>
    bucket?.account_id ? selectAccountById(state, bucket.account_id) : null,
  );

  const accountColorConfig = account?.color
    ? getColorConfig(account?.color)
    : null;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTransactionClick = () => {
    setTransactionModalOpen(true);
    handleMenuClose();
  };

  const handleMarketValueClick = () => {
    setMarketValueModalOpen(true);
    handleMenuClose();
  };

  return (
    <>
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleMenuOpen}
            size="small"
          >
            Add
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleTransactionClick}>Transaction</MenuItem>
            {bucket.type !== 'expense' && (
              <MenuItem onClick={handleMarketValueClick}>
                Market Value Report
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Transaction Modal */}
      <TransactionModal
        bucketId={bucket.id}
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
      />

      {/* Market Value Modal */}
      <MarketValueModal
        bucketId={bucket.id}
        currentMarketValue={bucket.market_value}
        open={marketValueModalOpen}
        onClose={() => setMarketValueModalOpen(false)}
      />
    </>
  );
}
