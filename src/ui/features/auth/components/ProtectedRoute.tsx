import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { useGetUserQuery } from '../api/authApi';
import { LoadingScreen } from '../../../shared/components/layout/LoadingScreen';

export function ProtectedRoute() {
  const { isLoading } = useGetUserQuery();
  const user = useAppSelector((state) => state.auth.user);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
