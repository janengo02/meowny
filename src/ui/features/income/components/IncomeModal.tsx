import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useGetIncomeSourceQuery } from '../api/incomeSourceApi';
import { IncomeHistoryTable } from './IncomeHistoryTable';

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
          <Typography variant="h2" component="span">
            {incomeSource.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={incomeSource.is_active ? 'Active' : 'Inactive'}
              size="small"
              color={incomeSource.is_active ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Income History Section */}
        <Box sx={{ mb: 4 }}>
          <IncomeHistoryTable incomeSourceId={incomeSourceId} />
        </Box>

        {/* Notes Section */}
        {incomeSource.notes && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
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
      </DialogContent>
    </Dialog>
  );
}
