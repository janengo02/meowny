import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface RenameAccountDialogProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
}

export function RenameAccountDialog({
  open,
  currentName,
  onClose,
  onRename,
}: RenameAccountDialogProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onRename(name.trim());
      onClose();
    } catch (error) {
      console.error('Failed to rename account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(currentName);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h3">Rename Account</DialogTitle>
      <DialogContent>
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
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || name.trim() === currentName || isLoading}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
}
