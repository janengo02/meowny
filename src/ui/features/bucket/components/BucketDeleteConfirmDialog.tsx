import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useDeleteBucketMutation } from '../api/bucketApi';

interface BucketDeleteConfirmDialogProps {
  bucket: Bucket;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  callback: () => void;
}
export function BucketDeleteConfirmDialog({
  bucket,
  deleteDialogOpen,
  setDeleteDialogOpen,
  callback,
}: BucketDeleteConfirmDialogProps) {
  const [deleteBucket, { isLoading: isDeleting }] = useDeleteBucketMutation();

  const handleDeleteConfirm = async () => {
    if (bucket) {
      try {
        await deleteBucket(bucket.id).unwrap();
        setDeleteDialogOpen(false);
        callback();
      } catch (error) {
        // Error handling - could show a toast/snackbar here
        console.error('Failed to delete bucket:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <Dialog
      open={deleteDialogOpen}
      onClose={handleDeleteCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle variant="h3" id="delete-dialog-title">
        Delete Bucket?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete "{bucket.name}"? This action cannot be
          undone. All associated transactions and value history will also be
          deleted.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteCancel} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleDeleteConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
