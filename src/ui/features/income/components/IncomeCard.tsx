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
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent>
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
