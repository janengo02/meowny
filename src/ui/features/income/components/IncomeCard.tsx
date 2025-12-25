import { Card, CardActionArea, CardContent, Typography } from '@mui/material';

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
          <Typography variant="h4" gutterBottom>
            {incomeSource.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
