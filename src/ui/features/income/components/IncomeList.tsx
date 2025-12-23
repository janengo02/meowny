import { useState } from 'react';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import {
  useCreateIncomeSourceMutation,
  useGetIncomeSourcesQuery,
} from '../api/incomeSourceApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import { IncomeCard } from './IncomeCard';
import { IncomeModal } from './IncomeModal';
import { AddIncomeCard } from './AddIncomeCard';

export function IncomeList() {
  const incomeSources = useAppSelector((state) => state.income.incomeSources);
  const [selectedIncomeId, setSelectedIncomeId] = useState<number | null>(null);
  const { isLoading: isLoadingIncomeSources, error: incomeSourcesError } =
    useGetIncomeSourcesQuery();
  const [createIncomeSource] = useCreateIncomeSourceMutation();
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
    <>
      <Typography variant="h2" sx={{ p: 2 }}>
        Your Income Sources
      </Typography>
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
    </>
  );
}
