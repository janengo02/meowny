import {
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
    <Card
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            gap: 1,
            mb: 1,
          }}
        >
          <Chip
            label={incomeSource.is_active ? 'Active' : 'Inactive'}
            size="small"
            color={incomeSource.is_active ? 'success' : 'default'}
            variant="outlined"
            sx={{
              textTransform: 'capitalize',
              ml: -1,
              fontSize: '0.75rem',
            }}
          />
          <Typography variant="h4" gutterBottom>
            {incomeSource.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
