import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';

interface IncomeCardProps {
  incomeSource: IncomeSource;
  onClick?: () => void;
}

export function IncomeCard({ incomeSource, onClick }: IncomeCardProps) {
  return (
    <Card sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={onClick} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h3" gutterBottom>
            {incomeSource.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={incomeSource.is_active ? 'Active' : 'Inactive'}
              size="small"
              color={incomeSource.is_active ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
