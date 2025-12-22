import { useContext } from 'react';
import { DashboardLayoutContext } from '../context/dashboardLayoutContext';

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error(
      'useDashboardLayout must be used within DashboardLayoutProvider',
    );
  }
  return context;
}
