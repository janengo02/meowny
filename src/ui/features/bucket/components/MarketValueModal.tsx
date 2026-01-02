import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormMoneyInput } from '../../../shared/components/form/FormMoneyInput';
import { DateTimePickerField } from '../../../shared/components/form/DateTimePickerField';
import {
  useCreateBucketValueHistoryMutation,
  useUpdateBucketValueHistoryMutation,
} from '../api/bucketValueHistoryApi';
import {
  marketValueSchema,
  type MarketValueFormData,
} from '../schemas/bucket.schemas';
import { formatDateForDB } from '../../../shared/utils/dateTime';

interface MarketValueModalProps {
  bucketId: number;
  currentMarketValue: number;
  open: boolean;
  onClose: () => void;
  historyToEdit?: BucketValueHistory | null;
}

export function MarketValueModal({
  bucketId,
  currentMarketValue,
  open,
  onClose,
  historyToEdit,
}: MarketValueModalProps) {
  const [createBucketValueHistory, { isLoading: isCreating }] =
    useCreateBucketValueHistoryMutation();
  const [updateBucketValueHistory, { isLoading: isUpdating }] =
    useUpdateBucketValueHistoryMutation();

  const isLoading = isCreating || isUpdating;

  const form = useForm<MarketValueFormData>({
    resolver: zodResolver(marketValueSchema),
    mode: 'onChange',
    defaultValues: {
      market_value: currentMarketValue,
      recorded_at: dayjs(),
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (historyToEdit) {
        // Editing mode - populate form with history data
        form.reset({
          market_value: historyToEdit.market_value,
          recorded_at: dayjs(historyToEdit.recorded_at),
          notes: historyToEdit.notes || '',
        });
      } else {
        // Create mode - reset to defaults
        form.reset({
          market_value: currentMarketValue,
          recorded_at: dayjs(),
          notes: '',
        });
      }
    }
  }, [open, currentMarketValue, historyToEdit, form]);

  const onSubmit = async (data: MarketValueFormData) => {
    try {
      const historyData = {
        market_value: data.market_value,
        recorded_at: formatDateForDB(data.recorded_at),
        notes: data.notes || null,
      };

      if (historyToEdit) {
        // Edit mode: use update mutation
        await updateBucketValueHistory({
          id: historyToEdit.id,
          bucketId,
          params: historyData,
        }).unwrap();
      } else {
        // Create mode: use create mutation
        await createBucketValueHistory({
          bucket_id: bucketId,
          source_type: 'market',
          ...historyData,
        }).unwrap();
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error(
        `Failed to ${historyToEdit ? 'update' : 'create'} market value:`,
        error,
      );
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <FormProvider {...form}>
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTitle
            variant="h3"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
            }}
          >
            {historyToEdit ? 'Edit Market Value' : 'Update Market Value'}
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}
            >
              <FormMoneyInput
                name="market_value"
                label="Market Value"
                variant="outlined"
                allowNegative={false}
              />

              <DateTimePickerField
                name="recorded_at"
                label="Recorded Date & Time"
              />

              <FormTextField name="notes" label="Notes" multiline rows={3} />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading
                ? historyToEdit
                  ? 'Updating...'
                  : 'Adding...'
                : historyToEdit
                  ? 'Update'
                  : 'Add'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
