import { useState } from 'react';
import { Box, Button, Chip, Grid, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { formatMoney } from '../../../shared/utils';
import { useGetBucketGoalsByBucketQuery } from '../api/bucketGoalApi';
import { BucketGoalModal } from './BucketGoalModal';

interface BucketGoalProps {
  bucketId: number;
}

export function BucketGoal({ bucketId }: BucketGoalProps) {
  const [bucketGoalModalOpen, setBucketGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<BucketGoal | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const { data: bucketGoals = [] } = useGetBucketGoalsByBucketQuery(bucketId);

  const now = new Date();
  const activeGoals = bucketGoals.filter((goal) => {
    const startDate = goal.start_date ? new Date(goal.start_date) : null;
    const endDate = goal.end_date ? new Date(goal.end_date) : null;

    // If both start and end time is empty, return true
    if (!startDate && !endDate) return true;

    // If start is empty, return true if now is before end
    if (!startDate && endDate) return now <= endDate;

    // If end is empty, return true if now is after start
    if (startDate && !endDate) return now >= startDate;

    // If both start and end is not empty, return true if now is between both
    return startDate && endDate && now >= startDate && now <= endDate;
  });

  const inactiveGoals = bucketGoals.filter((goal) => {
    const startDate = goal.start_date ? new Date(goal.start_date) : null;
    const endDate = goal.end_date ? new Date(goal.end_date) : null;

    // If start is empty, return true if now is before end
    if (!startDate && endDate) return now > endDate;

    // If end is empty, return true if now is after start
    if (startDate && !endDate) return now < startDate;

    return startDate && endDate && (now < startDate || now > endDate);
  });

  const goalsToDisplay = showInactive
    ? [...activeGoals, ...inactiveGoals]
    : activeGoals;

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4">Goals</Typography>
        {inactiveGoals.length > 0 && (
          <Button
            size="small"
            startIcon={
              showInactive ? <VisibilityOffIcon /> : <VisibilityIcon />
            }
            onClick={() => setShowInactive(!showInactive)}
            sx={{ textTransform: 'none' }}
          >
            {showInactive ? 'Hide Inactive Goals' : 'Show Inactive Goals'} (
            {inactiveGoals.length})
          </Button>
        )}
      </Box>
      {activeGoals.length === 0 && (
        <Box
          onClick={() => setBucketGoalModalOpen(true)}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <Typography color="text.secondary">
            No active goal. Click to create one
          </Typography>
        </Box>
      )}
      {goalsToDisplay.map((goal) => {
        const isActive = activeGoals.some((g) => g.id === goal.id);
        return (
          <Box
            key={goal.id}
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: isActive ? 'divider' : 'action.disabled',
              mb: 2,
              opacity: isActive ? 1 : 0.6,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}
              >
                {!isActive && (
                  <Chip
                    label="Inactive"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: 'action.disabledBackground',
                      color: 'text.secondary',
                    }}
                  />
                )}
                <Grid container spacing={2} sx={{ flex: 1 }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Min Amount
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {goal.min_amount !== null
                        ? formatMoney(goal.min_amount)
                        : '-'}
                    </Typography>
                    {goal.min_amount !== null && (
                      <Typography
                        variant="caption"
                        color={
                          goal.current_status >= goal.min_amount
                            ? 'success.main'
                            : 'text.secondary'
                        }
                      >
                        {goal.current_status >= goal.min_amount
                          ? '(Completed)'
                          : `(${formatMoney(goal.min_amount - goal.current_status)} to go)`}
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Max Amount
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {goal.max_amount !== null
                        ? formatMoney(goal.max_amount)
                        : '-'}
                    </Typography>
                    {goal.max_amount !== null && (
                      <Typography
                        variant="caption"
                        color={
                          goal.current_status >= goal.max_amount
                            ? 'success.main'
                            : 'text.secondary'
                        }
                      >
                        {goal.current_status >= goal.max_amount
                          ? '(Completed)'
                          : `(${formatMoney(goal.max_amount - goal.current_status)} left)`}
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Period Start
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {goal.start_date
                        ? new Date(goal.start_date).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Period End
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {goal.end_date
                        ? new Date(goal.end_date).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <IconButton
                size="small"
                onClick={() => {
                  setEditingGoal(goal);
                  setBucketGoalModalOpen(true);
                }}
                sx={{
                  ml: 1,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            {goal.notes && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {goal.notes}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}
      <BucketGoalModal
        bucketId={bucketId}
        goal={editingGoal}
        open={bucketGoalModalOpen}
        onClose={() => {
          setBucketGoalModalOpen(false);
          setEditingGoal(null);
        }}
      />
    </Box>
  );
}
