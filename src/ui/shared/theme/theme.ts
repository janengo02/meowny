import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3fa34d', // Bright matrix green
      light: '#7fb446',
      dark: '#26773aff',
      contrastText: '#000000',
    },
    secondary: {
      main: '#fbaf00', // Bright magenta
      light: '#ffd639',
      dark: '#c08b0fff',
      contrastText: '#000000',
    },
    background: {
      default: '#0a0a0a', // Deep black
      paper: '#1a1a1a',
    },
    error: {
      main: '#e51e5f', // Hot pink error
      light: '#ff3377',
      dark: '#cc0044',
    },
    warning: {
      main: '#ffff00', // Bright yellow
      contrastText: '#000000',
    },
    info: {
      main: '#00ffff', // Cyan
      contrastText: '#000000',
    },
    success: {
      main: '#3fa34d',
      contrastText: '#000000',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
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
          border: '3px solid #000000',
          padding: '12px 28px',
          transition: 'all 0.15s ease',
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
        contained: {
          border: '3px solid #000000',
        },
        outlined: {
          borderWidth: '3px',
          '&:hover': {
            borderWidth: '3px',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)',
            transition: 'all 0.15s ease',
            '& fieldset': {
              borderWidth: '3px',
              borderColor: '#000000',
              transition: 'all 0.15s ease',
            },
            '&:hover': {
              transform: 'translate(-1px, -1px)',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
            },
            '&:hover fieldset': {
              borderWidth: '3px',
            },
            '&.Mui-focused': {
              transform: 'translate(-1px, -1px)',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '3px',
            },
          },
        },
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
          backgroundColor: '#1a1a1a',
          border: '2px solid #000000',
          boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)',
          fontSize: '0.5rem',
        },
      },
    },
  },
});
