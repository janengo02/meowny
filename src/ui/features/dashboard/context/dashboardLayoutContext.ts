import { createContext } from 'react';

export type DashboardLayoutContextType = {
  layout: DashboardLayout | null;
  isLoading: boolean;
  saveLayout: (layout: DashboardLayout) => Promise<void>;
  resetToDefault: () => void;
};

export const DashboardLayoutContext = createContext<
  DashboardLayoutContextType | undefined
>(undefined);
