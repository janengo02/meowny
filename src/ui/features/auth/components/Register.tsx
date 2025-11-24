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
import { registerSchema, type RegisterFormData } from '../schemas/auth.schema';
import { useSignUpMutation } from '../api/authApi';

export function Register() {
  const navigate = useNavigate();
  const [signUp, { isLoading, error, isSuccess }] = useSignUpMutation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (isSuccess) {
      navigate('/dashboard');
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    await signUp({
      email: data.email,
      password: data.password,
      name: data.name,
    });
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
            Create Account
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Get started with Meowny
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <FormProvider {...form}>
            <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
              <FormTextField
                name="name"
                label="Name"
                placeholder="Enter your name"
                sx={{ mb: 2 }}
              />

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
                placeholder="Create a password"
                sx={{ mb: 2 }}
              />

              <FormTextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </Box>
          </FormProvider>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Sign In
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
