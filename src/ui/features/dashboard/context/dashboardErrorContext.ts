import { createContext } from 'react';

export interface DashboardErrorContextType {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const DashboardErrorContext = createContext<
  DashboardErrorContextType | undefined
>(undefined);
