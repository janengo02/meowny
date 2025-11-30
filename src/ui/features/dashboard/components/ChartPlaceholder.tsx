import { Card, CardContent, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface ChartPlaceholderProps {
  title: string;
  height?: number;
  icon?: ReactNode;
}

export function ChartPlaceholder({
  title,
  height = 200,
  icon
}: ChartPlaceholderProps) {
  return (
    <Card
      sx={{
        height,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <CardContent
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon && <Box sx={{ mb: 1, opacity: 0.5 }}>{icon}</Box>}
        <Typography color="text.secondary" variant="h6">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
          Coming soon
        </Typography>
      </CardContent>
    </Card>
  );
}
