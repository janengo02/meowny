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
  Link,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
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
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

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
            units: '',
          };
        case 'deposit_withdrawal':
          return {
            strategy: 'deposit_withdrawal',
            transactionDate: '',
            depositAmount: '',
            withdrawalAmount: '',
            notes: '',
            units: '',
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
            units: '',
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
      // Save template if checkbox is checked
      if (saveAsTemplate) {
        // Auto-generate template name based on headers and strategy
        const strategyName =
          strategy === 'single_transaction'
            ? 'Single Amount'
            : strategy === 'deposit_withdrawal'
              ? 'Deposit/Withdrawal'
              : 'With Category';
        const generatedName = `CSV Template (${strategyName}) - ${new Date().toLocaleDateString()}`;

        const newTemplate: CsvImportTemplate = {
          template_name: generatedName,
          csv_headers: headers,
          strategy,
          column_mapping: {
            transactionDate: data.transactionDate,
            transactionAmount:
              'transactionAmount' in data ? data.transactionAmount : undefined,
            depositAmount:
              'depositAmount' in data ? data.depositAmount : undefined,
            withdrawalAmount:
              'withdrawalAmount' in data ? data.withdrawalAmount : undefined,
            categoryColumn:
              'categoryColumn' in data ? data.categoryColumn : undefined,
            depositValue:
              'depositValue' in data ? data.depositValue : undefined,
            withdrawalValue:
              'withdrawalValue' in data ? data.withdrawalValue : undefined,
            notes: 'notes' in data ? data.notes : undefined,
            units: 'units' in data ? data.units : undefined,
          },
          created_at: new Date().toISOString(),
        };

        // Get existing templates
        try {
          const templatesPref = await window.electron.getUserPreference({
            preference_key: 'csv_templates',
          });

          const templates = templatesPref
            ? (templatesPref.preference_value as CsvImportTemplate[])
            : [];

          // Add new template to the array
          templates.push(newTemplate);

          // Save updated templates array
          await window.electron.upsertUserPreference({
            preference_key: 'csv_templates',
            preference_value: templates,
          });
        } catch (error) {
          console.error('Error saving template:', error);
        }
      }

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

  // Get strategy information for display
  const getStrategyInfo = () => {
    switch (strategy) {
      case 'single_transaction':
        return {
          title: 'Single Transaction Amount',
          description:
            'Use one column containing transaction amounts. Supports both signed (±) and unsigned values.',
        };
      case 'deposit_withdrawal':
        return {
          title: 'Separate Deposit & Withdrawal Columns',
          description:
            'Use two columns: one for deposits, one for withdrawals. Each row has a value in only one column.',
        };
      case 'transaction_with_category':
        return {
          title: 'Transaction Amount with Category',
          description:
            'Use one amount column and one category column. You\'ll specify which category values mean "Deposit" vs "Withdrawal".',
        };
    }
  };

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
            <FormSelectField
              name="units"
              label="Units (Optional)"
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
            <FormSelectField
              name="units"
              label="Units (Optional)"
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
            <FormSelectField
              name="units"
              label="Units (Optional)"
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
            <Card
              variant="outlined"
              sx={{
                mb: 3,
                bgcolor: 'action.selected',
                border: '1px solid',
                borderColor: 'primary.main',
              }}
            >
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      Mapping Strategy: {getStrategyInfo().title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getStrategyInfo().description}
                    </Typography>
                  </Box>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      onBack();
                    }}
                    sx={{
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      ml: 2,
                    }}
                  >
                    Change
                  </Link>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Map your CSV columns to the following fields. Buckets will be
              automatically assigned based on your transaction notes.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {renderStrategyFields()}
            </Box>

            {/* Save as Template Section */}
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    disabled={isProcessing}
                  />
                }
                label="Remember this template"
              />
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
