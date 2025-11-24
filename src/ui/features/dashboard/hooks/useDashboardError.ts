import { useContext } from 'react';
import {
  DashboardErrorContext,
  type DashboardErrorContextType,
} from '../context/dashboardErrorContext';

export function useDashboardError(): DashboardErrorContextType {
  const context = useContext(DashboardErrorContext);
  if (context === undefined) {
    throw new Error(
      'useDashboardError must be used within a DashboardErrorProvider',
    );
  }
  return context;
}
