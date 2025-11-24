import { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Link,
} from '@mui/material';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { useSignInMutation } from '../api/authApi';

export function Login() {
  const navigate = useNavigate();
  const [signIn, { isLoading, error, isSuccess }] = useSignInMutation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (isSuccess) {
      navigate('/dashboard');
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    await signIn(data);
  };

  const errorMessage =
    error && typeof error === 'object' && 'message' in error
      ? (error as { message: string }).message
      : null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 38px)',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h1" align="center" gutterBottom>
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Sign in to your account
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <FormProvider {...form}>
            <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
              <FormTextField
                name="email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                sx={{ mb: 2 }}
              />

              <FormTextField
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </FormProvider>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register">
              Register
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
