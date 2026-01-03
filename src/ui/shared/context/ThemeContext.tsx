import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setThemeMode } from '../../store/slices/themeSlice';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      mode,
      toggleTheme: () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        dispatch(setThemeMode(newMode));
      },
      setMode: (newMode: ThemeMode) => {
        dispatch(setThemeMode(newMode));
      },
    }),
    [mode, dispatch]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
