import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { getColorConfig } from '../../../shared/theme/colors';

interface ExpenseBucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
  category?: BucketCategory | null;
}

export function ExpenseBucketCard({ bucket, onClick, category }: ExpenseBucketCardProps) {
  const colorConfig = category ? getColorConfig(category.color) : null;

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        width: 'fit-content',
        ...(colorConfig && {
          borderColor: colorConfig.bgColor,
          outlineColor: colorConfig.bgColor,
        }),
        '&:hover': {
          transform: 'translate(-2px, -2px)',
          boxShadow: colorConfig
            ? `4px 4px 0px ${colorConfig.bgColor}`
            : '4px 4px 0px rgba(0, 0, 0, 0.6)',
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
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {bucket.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
