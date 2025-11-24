import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { theme } from '../shared/theme/theme';
import { store } from '../store/store';
import { TitleBar } from '../shared/components/layout/TitleBar';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicRoute } from '../features/auth/components/PublicRoute';
import { Login } from '../features/auth/components/Login';
import { Register } from '../features/auth/components/Register';
import { Dashboard } from '../features/dashboard/components/Dashboard';

function AppRoutes() {
  return (
    <Box sx={{ minHeight: '100vh', pt: '38px' }}>
      <TitleBar />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
