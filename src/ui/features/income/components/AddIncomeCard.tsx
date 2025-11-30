import { Card, CardActionArea, CardContent, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddIncomeCardProps {
  onClick?: () => void;
}

export function AddIncomeCard({ onClick }: AddIncomeCardProps) {
  return (
    <Card
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 140,
            py: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              mb: 1,
            }}
          >
            <AddIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
          </Box>
          <Typography color="text.secondary" variant="body2">
            Add Income Source
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
