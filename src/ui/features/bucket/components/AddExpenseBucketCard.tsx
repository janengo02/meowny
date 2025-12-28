import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { AddExpenseBucketDialog } from './AddExpenseBucketDialog';

interface AddExpenseBucketCardProps {
  account: Account;
  categoryId?: number | null;
}

export function AddExpenseBucketCard({
  account,
  categoryId,
}: AddExpenseBucketCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          display: 'inline-flex',
          flexDirection: 'column',
          width: 'fit-content',
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <CardActionArea onClick={() => setOpen(true)}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              pl: 1,
              pr: 1.5,
              py: 0,
            }}
          >
            <AddIcon sx={{ color: 'text.secondary', fontSize: '0.75rem' }} />
            <Typography color="text.secondary" variant="caption">
              Add
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <AddExpenseBucketDialog
        account={account}
        categoryId={categoryId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
