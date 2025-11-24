import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Button,
  Container,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppSelector } from '../../../store/hooks';
import { useSignOutMutation } from '../../auth/api/authApi';

export function Dashboard() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  const handleCreateBucket = async () => {
    setLoading(true);
    setError(null);
    try {
      const bucket = await window.electron.createBucket({
        name: `Bucket ${buckets.length + 1}`,
        type: 'expense',
        notes: 'Created from dashboard',
      });
      setBuckets((prev) => [...prev, bucket]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 38px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexGrow: 1,
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              {user.email.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Logging out...' : 'Logout'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Typography variant="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back! Manage your finances below.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h2">Your Buckets</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBucket}
              disabled={loading}
            >
              Create Bucket
            </Button>
          </Box>

          {buckets.length === 0 ? (
            <Card
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'transparent',
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">
                  No buckets yet. Create your first bucket to get started!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {buckets.map((bucket) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bucket.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h3" gutterBottom>
                        {bucket.name}
                      </Typography>
                      <Chip
                        label={bucket.type}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', mb: 2 }}
                      />
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">
                            Contributed
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            ${bucket.contributed_amount.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary">
                            Market Value
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            ${bucket.market_value.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                      {bucket.notes && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: 1,
                            borderColor: 'divider',
                          }}
                        >
                          {bucket.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
}
