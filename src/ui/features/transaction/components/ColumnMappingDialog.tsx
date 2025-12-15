import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  columnMappingSchema,
  type ColumnMappingFormData,
} from '../schemas/transaction.schema';

interface ColumnMappingDialogProps {
  open: boolean;
  headers: string[];
  onClose: () => void;
  onComplete: (mapping: {
    transactionDate: string;
    depositAmount?: string;
    withdrawalAmount?: string;
    notes: string;
  }) => void | Promise<void>;
}

export function ColumnMappingDialog({
  open,
  headers,
  onClose,
  onComplete,
}: ColumnMappingDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const methods = useForm<ColumnMappingFormData>({
    resolver: zodResolver(columnMappingSchema),
    mode: 'onChange',
    defaultValues: {
      transactionDate: '',
      depositAmount: '',
      withdrawalAmount: '',
      notes: '',
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const onSubmit = async (data: ColumnMappingFormData) => {
    setIsProcessing(true);
    try {
      // Use setTimeout to allow UI to update before heavy processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      await onComplete({
        transactionDate: data.transactionDate,
        depositAmount: data.depositAmount,
        withdrawalAmount: data.withdrawalAmount,
        notes: data.notes || '',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert headers to options format
  const headerOptions = useMemo(
    () => [
      { value: '', label: 'Select a column' },
      ...headers.map((header) => ({
        value: header,
        label: header,
      })),
    ],
    [headers],
  );

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
        Map CSV Columns
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Map your CSV columns to the following fields. Buckets will be
              automatically assigned based on your transaction notes.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormSelectField
                name="transactionDate"
                label="Transaction Date"
                options={headerOptions}
                disabled={isProcessing}
              />

              <FormSelectField
                name="depositAmount"
                label="Deposit Amount (Optional)"
                options={headerOptions}
                disabled={isProcessing}
              />

              <FormSelectField
                name="withdrawalAmount"
                label="Withdrawal Amount (Optional)"
                options={headerOptions}
                disabled={isProcessing}
              />

              <FormSelectField
                name="notes"
                label="Notes (Optional)"
                options={headerOptions}
                disabled={isProcessing}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={onClose}
              variant="outlined"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Next'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
