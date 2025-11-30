import { useState } from 'react';
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import {
  useCreateIncomeSourceMutation,
  useGetIncomeSourcesQuery,
} from '../api/incomeSourceApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import AddIcon from '@mui/icons-material/Add';
import { IncomeCard } from './IncomeCard';
import { IncomeModal } from './IncomeModal';
import { AddIncomeCard } from './AddIncomeCard';

export function IncomeList() {
  const incomeSources = useAppSelector((state) => state.income.incomeSources);
  const [selectedIncomeId, setSelectedIncomeId] = useState<number | null>(null);
  const { isLoading: isLoadingIncomeSources, error: incomeSourcesError } =
    useGetIncomeSourcesQuery();
  const [createIncomeSource, { isLoading: isCreatingIncomeSource }] =
    useCreateIncomeSourceMutation();
  const { setError } = useDashboardError();

  if (incomeSourcesError) {
    setError('Failed to load income sources. Please try again.');
  }

  const handleCreateIncomeSource = async () => {
    try {
      const result = await createIncomeSource({
        name: `New Income Source`,
        color: 'green',
        is_active: true,
        notes: '',
      }).unwrap();
      // Open the modal for the newly created income source
      setSelectedIncomeId(result.id);
    } catch {
      setError('Failed to create income source. Please try again.');
    }
  };

  if (isLoadingIncomeSources) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h2">Your Income Sources</Typography>
        <Button
          variant="text"
          startIcon={<AddIcon />}
          onClick={handleCreateIncomeSource}
          disabled={isCreatingIncomeSource}
        >
          Create Income Source
        </Button>
      </Box>

      <Grid container spacing={2}>
        {incomeSources.map((incomeSource) => (
          <Grid
            size={{ xs: 12, sm: 4, md: 3 }}
            key={incomeSource.id}
            sx={{ display: 'flex' }}
          >
            <IncomeCard
              incomeSource={incomeSource}
              onClick={() => setSelectedIncomeId(incomeSource.id)}
            />
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 4, md: 3 }} sx={{ display: 'flex' }}>
          <AddIncomeCard onClick={handleCreateIncomeSource} />
        </Grid>
      </Grid>

      <IncomeModal
        incomeSourceId={selectedIncomeId}
        open={selectedIncomeId !== null}
        onClose={() => setSelectedIncomeId(null)}
      />
    </Box>
  );
}
