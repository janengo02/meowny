import { useEffect, useMemo, useState } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { z } from 'zod';
import { DateTimePickerField } from '../../../shared/components/form/DateTimePickerField';
import { useGetBucketsQuery } from '../api/bucketApi';
import { useCreateBucketValueHistoryMutation } from '../api/bucketValueHistoryApi';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { InvestmentReportRow } from './InvestmentReportRow';

const investmentReportSchema = z.object({
  recorded_at: z.custom<dayjs.Dayjs>(
    (val) => val !== null && val !== undefined,
  ),
  buckets: z.array(
    z.object({
      bucket_id: z.number(),
      bucket_name: z.string(),
      total_units: z.number().nullable(),
      contributed_amount: z.number(),
      current_market_value: z.number(),
      market_value: z.number().min(0, 'Market value must be 0 or greater'),
      notes: z.string().optional(),
    }),
  ),
});

type InvestmentReportFormData = z.infer<typeof investmentReportSchema>;

interface InvestmentReportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InvestmentReportDialog({
  open,
  onClose,
}: InvestmentReportDialogProps) {
  const { data: allBuckets, isLoading: isLoadingBuckets } =
    useGetBucketsQuery();
  const [createBucketValueHistory, { isLoading: isCreatingHistory }] =
    useCreateBucketValueHistoryMutation();
  const [includeZeroUnits, setIncludeZeroUnits] = useState(false);

  const investmentBuckets = useMemo(() => {
    if (!allBuckets) return [];
    return allBuckets.filter((bucket) => {
      if (bucket.type !== 'investment') return false;
      if (includeZeroUnits) return true;
      return (bucket.total_units ?? 0) > 0;
    });
  }, [allBuckets, includeZeroUnits]);

  const form = useForm<InvestmentReportFormData>({
    resolver: zodResolver(investmentReportSchema),
    mode: 'onChange',
    defaultValues: {
      recorded_at: dayjs(),
      buckets: [],
    },
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: 'buckets',
  });

  useEffect(() => {
    if (open && investmentBuckets.length > 0) {
      form.reset({
        recorded_at: dayjs(),
        buckets: investmentBuckets.map((bucket) => ({
          bucket_id: bucket.id,
          bucket_name: bucket.name,
          total_units: bucket.total_units,
          contributed_amount: bucket.contributed_amount,
          current_market_value: bucket.market_value,
          market_value: bucket.market_value,
          notes: '',
        })),
      });
    }
  }, [open, investmentBuckets, form]);

  const onSubmit = async (data: InvestmentReportFormData) => {
    try {
      const recordedAt = formatDateForDB(data.recorded_at);

      // Create bucket value history for each bucket
      for (const bucket of data.buckets) {
        await createBucketValueHistory({
          bucket_id: bucket.bucket_id,
          market_value: bucket.market_value,
          recorded_at: recordedAt,
          source_type: 'market',
          notes: bucket.notes || null,
        }).unwrap();
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to report investment market values:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const isLoading = isLoadingBuckets || isCreatingHistory;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
            Report Investment Market Value
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}
            >
              <DateTimePickerField
                name="recorded_at"
                label="Recorded Date & Time"
                format="YYYY-MM-DD HH:mm:ss"
                ampm={false}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={includeZeroUnits}
                    onChange={(e) => setIncludeZeroUnits(e.target.checked)}
                  />
                }
                label="Include buckets with 0 units"
              />

              {isLoadingBuckets ? (
                <Typography>Loading investment buckets...</Typography>
              ) : fields.length === 0 ? (
                <Typography color="text.secondary">
                  No investment buckets with units found.
                </Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Bucket</TableCell>
                        <TableCell align="right">Total Units</TableCell>
                        <TableCell align="right">Contributed</TableCell>
                        <TableCell align="right">Gain/Loss</TableCell>
                        <TableCell align="right">Market Value</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => (
                        <InvestmentReportRow
                          key={field.id}
                          index={index}
                          onRemove={remove}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                isLoading || fields.length === 0 || !form.formState.isValid
              }
            >
              {isCreatingHistory ? 'Reporting...' : 'Report'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
