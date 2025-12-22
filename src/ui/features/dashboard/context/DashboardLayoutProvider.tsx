import { useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { DashboardLayoutContext } from './dashboardLayoutContext';
import {
  useGetDashboardLayoutQuery,
  useSaveDashboardLayoutMutation,
} from '../api/userPreferencesApi';

type DashboardLayoutProviderProps = {
  children: ReactNode;
};

// Default layout: Each chart is a separate draggable row
const DEFAULT_LAYOUT: DashboardLayout = {
  rows: [
    {
      id: 'row-1',
      order: 0,
      columns: [
        {
          id: 'col-1-1',
          width: 12,
          section: {
            type: 'assetsOverTimeChart',
          },
        },
      ],
    },
    {
      id: 'row-2',
      order: 1,
      columns: [
        {
          id: 'col-2-1',
          width: 12,
          section: {
            type: 'assetAccounts',
            accounts: [],
          },
        },
      ],
    },
    {
      id: 'row-3',
      order: 2,
      columns: [
        {
          id: 'col-3-1',
          width: 12,
          section: {
            type: 'expensePieChart',
          },
        },
      ],
    },
    {
      id: 'row-4',
      order: 3,
      columns: [
        {
          id: 'col-4-1',
          width: 12,
          section: {
            type: 'bucketGoalsChart',
          },
        },
      ],
    },
    {
      id: 'row-5',
      order: 4,
      columns: [
        {
          id: 'col-5-1',
          width: 12,
          section: {
            type: 'expenseAccounts',
          },
        },
      ],
    },
    {
      id: 'row-6',
      order: 5,
      columns: [
        {
          id: 'col-6-1',
          width: 12,
          section: {
            type: 'incomeOverTimeChart',
          },
        },
      ],
    },
    {
      id: 'row-7',
      order: 6,
      columns: [
        {
          id: 'col-7-1',
          width: 12,
          section: {
            type: 'incomeVsSavingsChart',
          },
        },
      ],
    },
    {
      id: 'row-8',
      order: 7,
      columns: [
        {
          id: 'col-8-1',
          width: 12,
          section: {
            type: 'income',
          },
        },
      ],
    },
  ],
};

export function DashboardLayoutProvider({
  children,
}: DashboardLayoutProviderProps) {
  const { data: savedLayoutPreference, isLoading } =
    useGetDashboardLayoutQuery();
  const [saveLayoutMutation] = useSaveDashboardLayoutMutation();
  const [localLayout, setLocalLayout] = useState<DashboardLayout | null>(null);

  // Use saved layout, local layout, or default
  const layout = useMemo(() => {
    if (localLayout) return localLayout;
    if (savedLayoutPreference?.dashboard_layout) {
      return savedLayoutPreference.dashboard_layout;
    }
    return DEFAULT_LAYOUT;
  }, [savedLayoutPreference, localLayout]);

  const saveLayout = useCallback(
    async (newLayout: DashboardLayout) => {
      try {
        setLocalLayout(newLayout);
        await saveLayoutMutation({
          dashboard_layout: newLayout,
        }).unwrap();
      } catch (error) {
        console.error('Failed to save dashboard layout:', error);
        throw error;
      }
    },
    [saveLayoutMutation],
  );

  const resetToDefault = useCallback(() => {
    setLocalLayout(DEFAULT_LAYOUT);
    saveLayoutMutation({
      dashboard_layout: DEFAULT_LAYOUT,
    });
  }, [saveLayoutMutation]);

  const value = useMemo(
    () => ({
      layout,
      isLoading,
      saveLayout,
      resetToDefault,
    }),
    [layout, isLoading, saveLayout, resetToDefault],
  );

  return (
    <DashboardLayoutContext.Provider value={value}>
      {children}
    </DashboardLayoutContext.Provider>
  );
}
