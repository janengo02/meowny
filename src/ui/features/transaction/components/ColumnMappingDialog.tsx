import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ColumnMappingDialogProps {
  open: boolean;
  headers: string[];
  onClose: () => void;
  onComplete: (mapping: {
    transactionDate: string;
    transactionAmount: string;
    notes: string;
    bucket: string;
  }) => void;
}

export function ColumnMappingDialog({
  open,
  headers,
  onClose,
  onComplete,
}: ColumnMappingDialogProps) {
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [bucket, setBucket] = useState('');

  const handleComplete = () => {
    if (!transactionDate || !transactionAmount || !notes || !bucket) {
      return;
    }
    onComplete({ transactionDate, transactionAmount, notes, bucket });
  };

  const isValid = transactionDate && transactionAmount && notes && bucket;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
        <Typography variant="h2">Map CSV Columns</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Map your CSV columns to the following fields:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Transaction Date</InputLabel>
            <Select
              value={transactionDate}
              label="Transaction Date"
              onChange={(e) => setTransactionDate(e.target.value)}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select a column</em>
              </MenuItem>
              {headers.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Transaction Amount</InputLabel>
            <Select
              value={transactionAmount}
              label="Transaction Amount"
              onChange={(e) => setTransactionAmount(e.target.value)}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select a column</em>
              </MenuItem>
              {headers.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Notes</InputLabel>
            <Select
              value={notes}
              label="Notes"
              onChange={(e) => setNotes(e.target.value)}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select a column</em>
              </MenuItem>
              {headers.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Bucket</InputLabel>
            <Select
              value={bucket}
              label="Bucket"
              onChange={(e) => setBucket(e.target.value)}
              MenuProps={{
                sx: {
                  '& .MuiPaper-root': {
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select a column</em>
              </MenuItem>
              {headers.map((header) => (
                <MenuItem key={header} value={header}>
                  {header}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          disabled={!isValid}
        >
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
}
