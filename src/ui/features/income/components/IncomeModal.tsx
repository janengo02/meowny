import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  useGetIncomeSourceQuery,
  useDeleteIncomeSourceMutation,
} from '../api/incomeSourceApi';
import { IncomeHistoryTable } from './IncomeHistoryTable';
import { IncomeTitle } from './IncomeTitle';
import { IncomeVisibilityToggle } from './IncomeVisibilityToggle';
import { IncomeDeleteConfirmDialog } from './IncomeDeleteConfirmDialog';

interface IncomeModalProps {
  incomeSourceId: number | null;
  open: boolean;
  onClose: () => void;
}

export function IncomeModal({
  incomeSourceId,
  open,
  onClose,
}: IncomeModalProps) {
  const { data: incomeSource, isLoading } = useGetIncomeSourceQuery(
    incomeSourceId!,
    {
      skip: !incomeSourceId,
    },
  );
  const [deleteIncomeSource] = useDeleteIncomeSourceMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeSourceId) return;

    try {
      await deleteIncomeSource(incomeSourceId).unwrap();
      setDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete income source:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  if (!incomeSourceId) return null;

  if (isLoading || !incomeSource) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 6,
          }}
        >
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        disableRestoreFocus
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <IncomeTitle incomeSource={incomeSource} />
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ ml: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* Income History Section */}
          <Box display="flex" flexDirection="column" gap={2} sx={{ mb: 3 }}>
            <IncomeVisibilityToggle
              incomeSourceId={incomeSource.id}
              isActive={incomeSource.is_active}
            />
            <IncomeHistoryTable incomeSourceId={incomeSourceId} />
          </Box>

          {/* Notes Section */}
          {incomeSource.notes && (
            <>
              <Divider sx={{ mb: 3 }} />
              <Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Notes
                </Typography>
                <Typography color="text.secondary">
                  {incomeSource.notes}
                </Typography>
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
              Delete Income Source
            </Button>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {new Date(incomeSource.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(incomeSource.updated_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <IncomeDeleteConfirmDialog
        open={deleteDialogOpen}
        incomeName={incomeSource.name}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
