import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { AddBucketDialog } from './AddBucketDialog';

interface AddBucketCardProps {
  account: Account;
}

export function AddBucketCard({ account }: AddBucketCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          height: '100%',
          width: '100%',
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardActionArea onClick={() => setOpen(true)} sx={{ flex: 1 }}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 2,
              pr: 1,
              pl: 0,
            }}
          >
            <AddIcon sx={{ color: 'text.secondary' }} />
            <Typography color="text.secondary" variant="body2">
              Add Bucket
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <AddBucketDialog
        account={account}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
