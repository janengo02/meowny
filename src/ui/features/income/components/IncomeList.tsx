import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { useCreateIncomeSourceMutation, useGetIncomeSourcesQuery } from '../api/incomeSourceApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import AddIcon from '@mui/icons-material/Add';
import { IncomeCard } from './IncomeCard';
import { IncomeModal } from './IncomeModal';

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
      await createIncomeSource({
        name: `Income Source ${incomeSources.length + 1}`,
        color: 'green',
        is_active: true,
        notes: 'Created from dashboard',
      }).unwrap();
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
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateIncomeSource}
          disabled={isCreatingIncomeSource}
        >
          Create Income Source
        </Button>
      </Box>

      {incomeSources.length === 0 ? (
        <Card
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'transparent',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              No income sources yet. Create your first income source to get started!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {incomeSources.map((incomeSource) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={incomeSource.id}>
              <IncomeCard
                incomeSource={incomeSource}
                onClick={() => setSelectedIncomeId(incomeSource.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <IncomeModal
        incomeSourceId={selectedIncomeId}
        open={selectedIncomeId !== null}
        onClose={() => setSelectedIncomeId(null)}
      />
    </Box>
  );
}
