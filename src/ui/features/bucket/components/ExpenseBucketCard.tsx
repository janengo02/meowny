import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { getColorConfig } from '../../../shared/theme/colors';

interface ExpenseBucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
  category?: BucketCategory | null;
}

export function ExpenseBucketCard({
  bucket,
  onClick,
  category,
}: ExpenseBucketCardProps) {
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
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
        '&:hover': {
          transform: 'translate(-1px, -1px)',
          boxShadow: colorConfig
            ? `2px 2px 0px ${colorConfig.bgColor}`
            : '2px 2px 0px rgba(0, 0, 0, 0.6)',
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
            px: 1,
            py: 0,
          }}
        >
          <Typography
            variant="caption"
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
