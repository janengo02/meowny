import { useMemo, useState, useEffect } from 'react';
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
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  columnMappingSchema,
  type ColumnMappingFormData,
  type AmountMappingStrategy,
} from '../schemas/transaction.schema';

interface CsvRow {
  [key: string]: string;
}

interface ColumnMappingDialogProps {
  open: boolean;
  headers: string[];
  csvData: CsvRow[];
  strategy: AmountMappingStrategy;
  onClose: () => void;
  onBack: () => void;
  onComplete: (mapping: ColumnMappingFormData) => void | Promise<void>;
}

export function ColumnMappingDialog({
  open,
  headers,
  csvData,
  strategy,
  onClose,
  onBack,
  onComplete,
}: ColumnMappingDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const methods = useForm<ColumnMappingFormData>({
    resolver: zodResolver(columnMappingSchema),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isValid },
    reset,
  } = methods;

  // Reset form when strategy changes
  useEffect(() => {
    // Get default values based on strategy
    const getDefaultValues = (
      strategy: AmountMappingStrategy,
    ): ColumnMappingFormData => {
      switch (strategy) {
        case 'single_transaction':
          return {
            strategy: 'single_transaction',
            transactionDate: '',
            transactionAmount: '',
            notes: '',
          };
        case 'deposit_withdrawal':
          return {
            strategy: 'deposit_withdrawal',
            transactionDate: '',
            depositAmount: '',
            withdrawalAmount: '',
            notes: '',
          };
        case 'transaction_with_category':
          return {
            strategy: 'transaction_with_category',
            transactionDate: '',
            transactionAmount: '',
            categoryColumn: '',
            depositValue: '',
            withdrawalValue: '',
            notes: '',
          };
      }
    };
    reset(getDefaultValues(strategy));
  }, [strategy, reset]);

  // Watch the category column selection for Option 3
  const categoryColumnWatch = useWatch({
    control: methods.control,
    name: 'categoryColumn',
  });

  const onSubmit = async (data: ColumnMappingFormData) => {
    setIsProcessing(true);
    try {
      // Use setTimeout to allow UI to update before heavy processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      await onComplete(data);
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

  // Extract unique values from selected category column for Option 3
  const categoryValueOptions = useMemo(() => {
    if (
      strategy !== 'transaction_with_category' ||
      !categoryColumnWatch ||
      categoryColumnWatch === ''
    ) {
      return [{ value: '', label: 'Select category column first' }];
    }

    // Extract unique values from the selected column
    const uniqueValues = new Set<string>();
    csvData.forEach((row) => {
      const value = row[categoryColumnWatch];
      if (value && value.trim() !== '') {
        uniqueValues.add(value.trim());
      }
    });

    // Convert to options format
    return [
      { value: '', label: 'Select a value' },
      ...Array.from(uniqueValues)
        .sort()
        .map((value) => ({
          value,
          label: value,
        })),
    ];
  }, [strategy, categoryColumnWatch, csvData]);

  const renderStrategyFields = () => {
    switch (strategy) {
      case 'single_transaction':
        return (
          <>
            <FormSelectField
              name="transactionDate"
              label="Transaction Date"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="transactionAmount"
              label="Transaction Amount"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="notes"
              label="Notes (Optional)"
              options={headerOptions}
              disabled={isProcessing}
            />
          </>
        );

      case 'deposit_withdrawal':
        return (
          <>
            <FormSelectField
              name="transactionDate"
              label="Transaction Date"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="depositAmount"
              label="Deposit Amount"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="withdrawalAmount"
              label="Withdrawal Amount"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="notes"
              label="Notes (Optional)"
              options={headerOptions}
              disabled={isProcessing}
            />
          </>
        );

      case 'transaction_with_category':
        return (
          <>
            <FormSelectField
              name="transactionDate"
              label="Transaction Date"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="transactionAmount"
              label="Transaction Amount"
              options={headerOptions}
              disabled={isProcessing}
            />
            <FormSelectField
              name="categoryColumn"
              label="Category Column"
              options={headerOptions}
              disabled={isProcessing}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Specify the values in the category column:
              </Typography>
              <FormSelectField
                name="depositValue"
                label="Deposit Value"
                options={categoryValueOptions}
                disabled={isProcessing || !categoryColumnWatch}
              />
              <FormSelectField
                name="withdrawalValue"
                label="Withdrawal Value"
                options={categoryValueOptions}
                disabled={isProcessing || !categoryColumnWatch}
              />
            </Box>
            <FormSelectField
              name="notes"
              label="Notes (Optional)"
              options={headerOptions}
              disabled={isProcessing}
            />
          </>
        );
    }
  };

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
              {renderStrategyFields()}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
              <Button
                onClick={onBack}
                variant="outlined"
                disabled={isProcessing}
              >
                Back
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
            </Box>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
