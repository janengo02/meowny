import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface IncomeDeleteConfirmDialogProps {
  open: boolean;
  incomeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function IncomeDeleteConfirmDialog({
  open,
  incomeName,
  onClose,
  onConfirm,
}: IncomeDeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle variant="h3">Delete Income Source</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{incomeName}</strong>? This
          action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
