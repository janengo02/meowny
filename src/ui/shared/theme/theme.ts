import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Extend the MUI Palette to include customColors
declare module '@mui/material/styles' {
  interface Palette {
    customColors: {
      red: { bgColor: string; color: string };
      yellow: { bgColor: string; color: string };
      green: { bgColor: string; color: string };
      blue: { bgColor: string; color: string };
      purple: { bgColor: string; color: string };
      violet: { bgColor: string; color: string };
      orange: { bgColor: string; color: string };
      pink: { bgColor: string; color: string };
      emerald: { bgColor: string; color: string };
      gray: { bgColor: string; color: string };
      brown: { bgColor: string; color: string };
      navy: { bgColor: string; color: string };
      cyan: { bgColor: string; color: string };
      magenta: { bgColor: string; color: string };
      teal: { bgColor: string; color: string };
      lime: { bgColor: string; color: string };
      indigo: { bgColor: string; color: string };
      default: { bgColor: string; color: string };
    };
  }

  interface PaletteOptions {
    customColors?: {
      red?: { bgColor: string; color: string };
      yellow?: { bgColor: string; color: string };
      green?: { bgColor: string; color: string };
      blue?: { bgColor: string; color: string };
      purple?: { bgColor: string; color: string };
      violet?: { bgColor: string; color: string };
      orange?: { bgColor: string; color: string };
      pink?: { bgColor: string; color: string };
      emerald?: { bgColor: string; color: string };
      gray?: { bgColor: string; color: string };
      brown?: { bgColor: string; color: string };
      navy?: { bgColor: string; color: string };
      cyan?: { bgColor: string; color: string };
      magenta?: { bgColor: string; color: string };
      teal?: { bgColor: string; color: string };
      lime?: { bgColor: string; color: string };
      indigo?: { bgColor: string; color: string };
      default?: { bgColor: string; color: string };
    };
  }
}

export type ThemeMode = 'light' | 'dark';

const getDesignTokens = (mode: ThemeMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#3fa34d', // Bright matrix green
      light: '#7fb446',
      dark: '#26773aff',
      contrastText: mode === 'dark' ? '#000000' : '#ffffff',
    },
    secondary: {
      main: '#fbaf00', // Bright orange
      light: '#ffd639',
      dark: '#c08b0fff',
      contrastText: '#000000',
    },
    background: mode === 'dark'
      ? {
          default: '#0a0a0a', // Deep black
          paper: '#1a1a1a',
        }
      : {
          default: '#f5f5f5', // Light gray
          paper: '#ffffff',
        },
    error: {
      main: '#e51e5f', // Hot pink error
      light: '#ff3377',
      dark: '#cc0044',
    },
    warning: {
      main: mode === 'dark' ? '#ffff00' : '#ff9800', // Bright yellow for dark, orange for light
      contrastText: '#000000',
    },
    info: {
      main: mode === 'dark' ? '#00ffff' : '#0288d1', // Cyan for dark, blue for light
      contrastText: mode === 'dark' ? '#000000' : '#ffffff',
    },
    success: {
      main: '#3fa34d',
      contrastText: mode === 'dark' ? '#000000' : '#ffffff',
    },
    text: mode === 'dark'
      ? {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
          disabled: 'rgba(255, 255, 255, 0.5)',
        }
      : {
          primary: '#000000',
          secondary: 'rgba(0, 0, 0, 0.6)',
          disabled: 'rgba(0, 0, 0, 0.38)',
        },
    // Custom color mappings from COLOR_HEX_MAP
    customColors: mode === 'dark'
      ? {
          red: { bgColor: '#991b1b', color: '#ffffff' },
          yellow: { bgColor: '#854d0e', color: '#ffffff' },
          green: { bgColor: '#166534', color: '#ffffff' },
          blue: { bgColor: '#1e40af', color: '#ffffff' },
          purple: { bgColor: '#7e22ce', color: '#ffffff' },
          violet: { bgColor: '#6d28d9', color: '#ffffff' },
          orange: { bgColor: '#c2410c', color: '#ffffff' },
          pink: { bgColor: '#be185d', color: '#ffffff' },
          emerald: { bgColor: '#065f46', color: '#ffffff' },
          gray: { bgColor: '#4b5563', color: '#ffffff' },
          brown: { bgColor: '#78350f', color: '#ffffff' },
          navy: { bgColor: '#1e3a8a', color: '#ffffff' },
          cyan: { bgColor: '#155e75', color: '#ffffff' },
          magenta: { bgColor: '#a21caf', color: '#ffffff' },
          teal: { bgColor: '#115e59', color: '#ffffff' },
          lime: { bgColor: '#4d7c0f', color: '#ffffff' },
          indigo: { bgColor: '#4338ca', color: '#ffffff' },
          default: { bgColor: '#4b5563', color: '#ffffff' },
        }
      : {
          // Light mode - lighter backgrounds with darker text
          red: { bgColor: '#fecaca', color: '#7f1d1d' },
          yellow: { bgColor: '#fef3c7', color: '#713f12' },
          green: { bgColor: '#bbf7d0', color: '#14532d' },
          blue: { bgColor: '#bfdbfe', color: '#1e3a8a' },
          purple: { bgColor: '#e9d5ff', color: '#581c87' },
          violet: { bgColor: '#ddd6fe', color: '#4c1d95' },
          orange: { bgColor: '#fed7aa', color: '#7c2d12' },
          pink: { bgColor: '#fbcfe8', color: '#831843' },
          emerald: { bgColor: '#a7f3d0', color: '#064e3b' },
          gray: { bgColor: '#e5e7eb', color: '#1f2937' },
          brown: { bgColor: '#fde68a', color: '#78350f' },
          navy: { bgColor: '#bfdbfe', color: '#1e3a8a' },
          cyan: { bgColor: '#a5f3fc', color: '#164e63' },
          magenta: { bgColor: '#f5d0fe', color: '#86198f' },
          teal: { bgColor: '#99f6e4', color: '#134e4a' },
          lime: { bgColor: '#d9f99d', color: '#365314' },
          indigo: { bgColor: '#c7d2fe', color: '#3730a3' },
          default: { bgColor: '#e5e7eb', color: '#1f2937' },
        },
  },
  typography: {
    fontFamily:
      '"Space Grotesk", "Noto Sans", "Noto Sans JP", "Noto Sans SC", sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h5: {
      fontSize: '0.85rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h6: {
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    body1: {
      fontSize: '0.85rem',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 12, // Rounded for comic style
  },
  shadows: [
    'none',
    '4px 4px 0px rgba(0, 0, 0, 0.8)', // Comic book offset shadow
    '4px 4px 0px rgba(0, 0, 0, 0.8)',
    '6px 6px 0px rgba(0, 0, 0, 0.8)',
    '6px 6px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
    '8px 8px 0px rgba(0, 0, 0, 0.8)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          transition: 'all 0.15s ease',
        },
        contained: {
          border: '3px solid #000000',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)',
          },
          '&:active': {
            transform: 'translate(1px, 1px)',
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
          },
        },
        outlined: {
          borderWidth: '3px',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          '&:hover': {
            borderWidth: '3px',
            transform: 'translate(-2px, -2px)',
            boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)',
          },
          '&:active': {
            transform: 'translate(1px, 1px)',
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
          },
        },
        text: {
          '&:hover': {
            background: 'none',
            filter: 'brightness(0.8)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)',
          transition: 'all 0.15s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '2px solid #000000',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          transition: 'all 0.15s ease',
        },
        elevation0: {
          border: 'none',
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
        },
        elevation2: {
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)',
        },
        elevation3: {
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '3px solid #000000',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          letterSpacing: '0.03em',
          border: '2px solid #000000',
          boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#000000',
          borderWidth: '2px',
        },
        head: {
          fontWeight: 700,
          letterSpacing: '0.03em',
          borderBottomWidth: '3px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          border: '2px solid transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            border: '2px solid #000000',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          border: '3px solid #000000',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark' ? '#1a1a1a' : '#424242',
          border: '2px solid #000000',
          boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)',
          fontSize: '0.5rem',
        },
      },
    },
  },
});

export const createAppTheme = (mode: ThemeMode) => createTheme(getDesignTokens(mode));

// Default export for backward compatibility
export const theme = createAppTheme('dark');
