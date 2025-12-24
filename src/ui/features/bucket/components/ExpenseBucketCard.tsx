import { Card, CardActionArea, CardContent, Typography } from '@mui/material';

interface ExpenseBucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
}

export function ExpenseBucketCard({ bucket, onClick }: ExpenseBucketCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        width: 'fit-content',
        '&:hover': {
          transform: 'translate(-2px, -2px)',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.6)',
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            px: 1.5,
            py: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            {bucket.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
