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
import {
  useCreateBucketGoalMutation,
  useUpdateBucketGoalMutation,
  useDeleteBucketGoalMutation,
} from '../api/bucketGoalApi';

const bucketGoalSchema = z.object({
  min_amount: z.string().optional(),
  max_amount: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

type BucketGoalFormData = z.infer<typeof bucketGoalSchema>;

interface BucketGoalModalProps {
  bucketId: number;
  goal?: BucketGoal | null;
  open: boolean;
  onClose: () => void;
}

export function BucketGoalModal({
  bucketId,
  goal,
  open,
  onClose,
}: BucketGoalModalProps) {
  const isNew = !goal;
  const [createBucketGoal, { isLoading: isCreating }] =
    useCreateBucketGoalMutation();
  const [updateBucketGoal, { isLoading: isUpdating }] =
    useUpdateBucketGoalMutation();
  const [deleteBucketGoal, { isLoading: isDeleting }] =
    useDeleteBucketGoalMutation();

  const isLoading = isCreating || isUpdating || isDeleting;

  const form = useForm<BucketGoalFormData>({
    resolver: zodResolver(bucketGoalSchema),
    mode: 'onChange',
    defaultValues: {
      min_amount: '',
      max_amount: '',
      start_date: '',
      end_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (!isNew) {
        // Editing mode - populate with existing goal data
        form.reset({
          min_amount: goal.min_amount !== null ? String(goal.min_amount) : '',
          max_amount: goal.max_amount !== null ? String(goal.max_amount) : '',
          start_date: goal.start_date
            ? new Date(goal.start_date).toISOString().split('T')[0]
            : '',
          end_date: goal.end_date
            ? new Date(goal.end_date).toISOString().split('T')[0]
            : '',
          notes: goal.notes || '',
        });
      } else {
        // Create mode - reset to empty
        form.reset({
          min_amount: '',
          max_amount: '',
          start_date: '',
          end_date: '',
          notes: '',
        });
      }
    }
  }, [open, goal, isNew, form]);

  const onSubmit = async (data: BucketGoalFormData) => {
    try {
      // Format start_date to 0:00:00
      let formattedStartDate: string | null = null;
      if (data.start_date) {
        const startDate = new Date(data.start_date);
        startDate.setHours(0, 0, 0, 0);
        formattedStartDate = startDate.toISOString();
      }

      // Format end_date to 23:59:59
      let formattedEndDate: string | null = null;
      if (data.end_date) {
        const endDate = new Date(data.end_date);
        endDate.setHours(23, 59, 59, 999);
        formattedEndDate = endDate.toISOString();
      }

      if (!isNew) {
        // Update existing goal
        await updateBucketGoal({
          id: goal.id,
          params: {
            bucket_id: bucketId,
            min_amount: data.min_amount ? parseFloat(data.min_amount) : null,
            max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            notes: data.notes || null,
          },
        }).unwrap();
      } else {
        // Create new goal
        await createBucketGoal({
          bucket_id: bucketId,
          min_amount: data.min_amount ? parseFloat(data.min_amount) : null,
          max_amount: data.max_amount ? parseFloat(data.max_amount) : null,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          notes: data.notes || null,
        }).unwrap();
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to save bucket goal:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleDelete = async () => {
    if (!goal) return;

    if (
      !window.confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      await deleteBucketGoal({ id: goal.id, bucketId }).unwrap();
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to delete bucket goal:', error);
    }
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
            {isNew ? 'Create Bucket Goal' : 'Edit Bucket Goal'}
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}
            >
              <FormTextField
                name="min_amount"
                label="Min Amount"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
              />

              <FormTextField
                name="max_amount"
                label="Max Amount"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
              />

              <FormTextField
                name="start_date"
                label="Period Start"
                type="date"
                InputLabelProps={{ shrink: true }}
              />

              <FormTextField
                name="end_date"
                label="Period End"
                type="date"
                InputLabelProps={{ shrink: true }}
              />

              <FormTextField name="notes" label="Notes" multiline rows={3} />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            {!isNew && (
              <Button
                onClick={handleDelete}
                disabled={isLoading}
                color="error"
                sx={{ mr: 'auto' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading
                ? isNew
                  ? 'Creating...'
                  : 'Updating...'
                : isNew
                  ? 'Create'
                  : 'Update'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
