import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

const getInitialTheme = (): ThemeMode => {
  const stored = localStorage.getItem('theme-mode');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  // Default to dark mode to match existing theme
  return 'dark';
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem('theme-mode', action.payload);
    },
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
