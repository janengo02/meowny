import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { useGetHiddenIncomeSourcesQuery } from '../api/settingsApi';
import { IncomeCard } from '../../income/components/IncomeCard';
import { useState } from 'react';
import { IncomeModal } from '../../income/components/IncomeModal';
import { Navbar } from '../../dashboard/components/Navbar';

export function HiddenIncome() {
  const {
    data: hiddenIncomeSources,
    isLoading,
    error,
  } = useGetHiddenIncomeSourcesQuery();
  const [selectedIncomeSourceId, setSelectedIncomeSourceId] = useState<
    number | null
  >(null);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load hidden income sources</Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Hidden Income Sources
        </Typography>

        {!hiddenIncomeSources || hiddenIncomeSources.length === 0 ? (
          <Alert severity="info">No hidden income sources found</Alert>
        ) : (
          <Grid container spacing={2}>
            {hiddenIncomeSources.map((incomeSource) => (
              <Grid key={incomeSource.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <IncomeCard
                  incomeSource={incomeSource}
                  onClick={() => setSelectedIncomeSourceId(incomeSource.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <IncomeModal
        incomeSourceId={selectedIncomeSourceId}
        open={selectedIncomeSourceId !== null}
        onClose={() => setSelectedIncomeSourceId(null)}
      />
    </>
  );
}
