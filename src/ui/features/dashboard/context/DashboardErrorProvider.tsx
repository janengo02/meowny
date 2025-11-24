import { useState, useCallback, type ReactNode } from 'react';
import { DashboardErrorContext } from './dashboardErrorContext';

interface DashboardErrorProviderProps {
  children: ReactNode;
}

export function DashboardErrorProvider({
  children,
}: DashboardErrorProviderProps) {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <DashboardErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
    </DashboardErrorContext.Provider>
  );
}
