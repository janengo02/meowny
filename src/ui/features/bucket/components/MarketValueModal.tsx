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
import { z } from 'zod';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { useCreateBucketValueHistoryMutation } from '../api/bucketValueHistoryApi';
import { getTokyoDateTime } from '../../../shared/utils';

const marketValueSchema = z.object({
  market_value: z.string().min(1, 'Market value is required'),
  recorded_at: z.string().min(1, 'Recorded date is required'),
  notes: z.string().optional(),
});

type MarketValueFormData = z.infer<typeof marketValueSchema>;

interface MarketValueModalProps {
  bucketId: number;
  currentMarketValue: number;
  open: boolean;
  onClose: () => void;
}

export function MarketValueModal({
  bucketId,
  currentMarketValue,
  open,
  onClose,
}: MarketValueModalProps) {
  const [createBucketValueHistory, { isLoading: isCreatingHistory }] =
    useCreateBucketValueHistoryMutation();

  const isLoading = isCreatingHistory;

  const form = useForm<MarketValueFormData>({
    resolver: zodResolver(marketValueSchema),
    mode: 'onChange',
    defaultValues: {
      market_value: String(currentMarketValue),
      recorded_at: getTokyoDateTime(),
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        market_value: String(currentMarketValue),
        recorded_at: getTokyoDateTime(),
        notes: '',
      });
    }
  }, [open, currentMarketValue, form]);

  const onSubmit = async (data: MarketValueFormData) => {
    try {
      const newMarketValue = parseFloat(data.market_value);

      // Create bucket value history record
      await createBucketValueHistory({
        bucket_id: bucketId,
        market_value: newMarketValue,
        recorded_at: new Date(data.recorded_at).toISOString(),
        source_type: 'market',
        notes: data.notes || null,
      }).unwrap();

      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to update market value:', error);
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
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
            }}
          >
            Update Market Value
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}
            >
              <FormTextField
                name="market_value"
                label="Market Value"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
              />

              <FormTextField
                name="recorded_at"
                label="Recorded Date & Time (Tokyo)"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                slotProps={{ htmlInput: { step: 1 } }}
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
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
