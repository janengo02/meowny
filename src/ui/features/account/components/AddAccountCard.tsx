import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { AddAccountDialog } from './AddAccountDialog';

interface AddAccountCardProps {
  type: AccountTypeEnum;
}

export function AddAccountCard({ type }: AddAccountCardProps) {
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
            <Typography variant="body2" color="text.secondary">
              Add {type.charAt(0).toUpperCase() + type.slice(1)} Account
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>

      <AddAccountDialog
        type={type}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
