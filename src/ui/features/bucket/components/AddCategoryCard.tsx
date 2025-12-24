import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { AddCategoryDialog } from './AddCategoryDialog';

interface AddCategoryCardProps {
  account: Account;
}

export function AddCategoryCard({ account }: AddCategoryCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          display: 'inline-flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
        }}
      >
        <CardActionArea onClick={() => setOpen(true)} sx={{ height: '100%' }}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 0.5,
              px: 1.5,
              py: 1,
            }}
          >
            <AddIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Typography color="text.secondary" variant="body1">
              Add Category
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <AddCategoryDialog
        account={account}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
