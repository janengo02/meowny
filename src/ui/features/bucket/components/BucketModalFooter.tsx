import { Box, Button, Divider, Typography } from '@mui/material';
import { useState } from 'react';
import { BucketDeleteConfirmDialog } from './BucketDeleteConfirmDialog';
import DeleteIcon from '@mui/icons-material/Delete';

interface BucketModalFooterProps {
  bucket: Bucket;
  onClose: () => void;
}
export function BucketModalFooter({ bucket, onClose }: BucketModalFooterProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  return (
    <>
      {/* Notes Section */}
      {bucket.notes && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Notes
            </Typography>
            <Typography color="text.secondary">{bucket.notes}</Typography>
          </Box>
        </>
      )}

      {/* Metadata */}
      <Divider sx={{ my: 3 }} />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={handleDeleteClick}
          startIcon={<DeleteIcon />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Delete Bucket
        </Button>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">
              {new Date(bucket.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {new Date(bucket.updated_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Box>
      {/* Delete Confirmation Dialog */}
      <BucketDeleteConfirmDialog
        bucket={bucket}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        callback={onClose}
      />
    </>
  );
}
