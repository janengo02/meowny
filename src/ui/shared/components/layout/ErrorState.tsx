import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { SxProps, Theme } from '@mui/material';

interface ErrorStateProps {
  title?: string;
  description?: string;
  sx?: SxProps<Theme>;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try refreshing the page',
  sx,
}: ErrorStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        ...sx,
      }}
    >
      <ErrorOutlineIcon
        sx={{ fontSize: 64, color: 'error.main', opacity: 0.5 }}
      />
      <Typography variant="h6" color="error">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
