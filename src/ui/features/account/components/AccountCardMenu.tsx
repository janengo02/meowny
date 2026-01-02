import { useState } from 'react';
import {
  Popover,
  TextField,
  Button,
  Divider,
  Box,
  IconButton,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { AVAILABLE_COLORS, getColorConfig } from '../../../shared/theme/colors';
import {
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '../api/accountApi';
import { DeleteAccountDialog } from './DeleteAccountDialog';

interface AccountCardMenuProps {
  account: Account;
}

export function AccountCardMenu({ account }: AccountCardMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editedName, setEditedName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [updateAccount] = useUpdateAccountMutation();
  const [deleteAccount] = useDeleteAccountMutation();

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setEditedName(account.name);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setEditedName('');
  };

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== account.name) {
      try {
        await updateAccount({
          id: account.id,
          params: { name: editedName.trim() },
        }).unwrap();
      } catch (error) {
        console.error('Failed to rename account:', error);
      }
    }
  };

  const handleColorSelect = async (color: ColorEnum) => {
    try {
      await updateAccount({
        id: account.id,
        params: { color },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update account color:', error);
    }
  };

  const handleDeleteClick = () => {
    handlePopoverClose();
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(account.id).unwrap();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handlePopoverOpen}
        aria-label="account options"
      >
        <MoreVertIcon sx={{ fontSize: '0.75rem' }} />
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          {/* Name input with Save button */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Account name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave();
                  }
                }}
                sx={{ width: 150 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleNameSave}
                disabled={!editedName.trim() || editedName === account.name}
                sx={{
                  minWidth: 'auto',
                  fontSize: '0.75rem',
                  py: 0.75,
                  px: 1.25,
                }}
              >
                Save
              </Button>
            </Box>
          </Box>

          {/* Color selection grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 1,
              mb: 2,
            }}
          >
            {AVAILABLE_COLORS.map((colorOption) => {
              const config = getColorConfig(colorOption);
              return (
                <Box
                  key={colorOption}
                  onClick={() => handleColorSelect(colorOption)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: config.bgColor,
                    cursor: 'pointer',
                    border: '3px solid ',
                    borderColor:
                      account.color === colorOption
                        ? 'primary.main'
                        : '#000000',

                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                    '&:hover': {
                      transform: 'translate(-1px, -1px)',
                      boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
                    },
                    '&:active': {
                      transform: 'translate(1px, 1px)',
                      boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                    },
                  }}
                />
              );
            })}
          </Box>

          {/* Divider and Delete button */}
          <Divider />
          <Button
            fullWidth
            variant="text"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            sx={{ justifyContent: 'flex-start', mt: 1 }}
          >
            Delete Account
          </Button>
        </Box>
      </Popover>

      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        accountName={account.name}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
      />
    </>
  );
}
