import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useState } from 'react';
import { useCreateAccountMutation } from '../api/accountApi';

interface AddAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddAssetAccountDialog({
  open,
  onClose,
}: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await createAccount({
        name: name.trim(),
        type: 'asset',
      }).unwrap();
      setName('');
      onClose();
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h3">Add Asset Account</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || isLoading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
