import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { useMemo } from 'react';
import { createAppTheme } from '../shared/theme/theme';
import { store } from '../store/store';
import { ThemeProvider, useTheme } from '../shared/context/ThemeContext';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicRoute } from '../features/auth/components/PublicRoute';
import { Login } from '../features/auth/components/Login';
import { Register } from '../features/auth/components/Register';
import { Dashboard } from '../features/dashboard/components/Dashboard';
import { HiddenBuckets } from '../features/settings/components/HiddenBuckets';
import { HiddenIncome } from '../features/settings/components/HiddenIncome';

function AppRoutes() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings/hidden-buckets" element={<HiddenBuckets />} />
          <Route path="/settings/hidden-income-sources" element={<HiddenIncome />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Box>
  );
}

function ThemedApp() {
  const { mode } = useTheme();
  const muiTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
