import {
  Grid,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { ExpenseAccountCard } from './ExpenseAccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';
import { AddExpenseAccountDialog } from './AddExpenseAccountDialog';
import { AddExpenseBucketDialog } from '../../bucket/components/AddExpenseBucketDialog';

export function ExpenseAccountList() {
  // Only select account IDs - ExpenseAccountCard will fetch its own buckets
  const accountIds = useAppSelector((state) =>
    selectAccountIdsByType(state, 'expense'),
  );

  // State for Add button dropdown menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isBucketDialogOpen, setIsBucketDialogOpen] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExpenseAccountClick = () => {
    handleMenuClose();
    setIsAccountDialogOpen(true);
  };

  const handleExpenseBucketClick = () => {
    handleMenuClose();
    setIsBucketDialogOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
        }}
      >
        <Typography variant="h2">Expense Accounts</Typography>
        <Button
          variant="contained"
          size="small"
          onClick={handleAddClick}
          aria-controls={isMenuOpen ? 'add-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isMenuOpen ? 'true' : undefined}
          startIcon={<AddIcon />}
          endIcon={<ArrowDropDownIcon />}
        >
          Add
        </Button>
        <Menu
          id="add-menu"
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'add-button',
          }}
        >
          <MenuItem onClick={handleExpenseAccountClick}>
            Expense Account
          </MenuItem>
          <MenuItem onClick={handleExpenseBucketClick}>
            Expense Bucket
          </MenuItem>
        </Menu>
      </Box>

      <Grid container>
        {accountIds.map((accountId) => (
          <Grid key={accountId} size={{ xs: 12 }}>
            <ExpenseAccountCard accountId={accountId} />
          </Grid>
        ))}
      </Grid>

      <AddExpenseAccountDialog
        open={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
      />

      <AddExpenseBucketDialog
        open={isBucketDialogOpen}
        onClose={() => setIsBucketDialogOpen(false)}
      />
    </>
  );
}
