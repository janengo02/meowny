import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddIncomeCardProps {
  onClick?: () => void;
}

export function AddIncomeCard({ onClick }: AddIncomeCardProps) {
  return (
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
      <CardActionArea onClick={onClick} sx={{ flex: 1 }}>
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
            Add Income Source
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
