# Theme-Aware Custom Colors

The custom color palette (`COLOR_HEX_MAP`) has been integrated into the MUI theme system with support for both light and dark modes.

## Features

- ✅ **Automatic theme switching**: Colors automatically adapt when switching between light and dark modes
- ✅ **Type-safe**: Full TypeScript support with autocomplete
- ✅ **18 colors**: red, yellow, green, blue, purple, violet, orange, pink, emerald, gray, brown, navy, cyan, magenta, teal, lime, indigo, default
- ✅ **Consistent API**: Use the same color across your app with automatic theme adaptation

## Color Differences

### Dark Mode
- Dark backgrounds (e.g., `#991b1b` for red)
- White text (`#ffffff`)

### Light Mode
- Light backgrounds (e.g., `#fecaca` for red)
- Dark text (e.g., `#7f1d1d` for red)

## Usage

### Option 1: Using the `useThemeColors` Hook (Recommended)

```tsx
import { useThemeColors } from '../shared/theme/useThemeColors';

function MyComponent() {
  const { getColorConfig, getBgColor, getTextColor } = useThemeColors();

  // Get both bg and text color
  const redConfig = getColorConfig('red');

  return (
    <Box sx={{
      backgroundColor: redConfig.bgColor,
      color: redConfig.color,
    }}>
      Red Box
    </Box>
  );
}
```

### Option 2: Using Theme in `sx` Prop

```tsx
import { Box } from '@mui/material';

function MyComponent() {
  return (
    <Box sx={{
      backgroundColor: (theme) => theme.palette.customColors.blue.bgColor,
      color: (theme) => theme.palette.customColors.blue.color,
    }}>
      Blue Box
    </Box>
  );
}
```

### Option 3: Using `useTheme` Hook

```tsx
import { useTheme } from '@mui/material';

function MyComponent() {
  const theme = useTheme();
  const purpleColors = theme.palette.customColors.purple;

  return (
    <Box sx={{
      backgroundColor: purpleColors.bgColor,
      color: purpleColors.color,
    }}>
      Purple Box
    </Box>
  );
}
```

### Option 4: Fallback - Using `COLOR_HEX_MAP` (Legacy)

The original `COLOR_HEX_MAP` and helper functions (`getColorConfig`, `getColorHex`, `getTextColor`) still work but **only provide dark mode colors**. They don't adapt to theme changes.

```tsx
import { getColorConfig } from '../shared/theme/colors';

// This will always return dark mode colors
const redConfig = getColorConfig('red'); // { bgColor: '#991b1b', color: '#ffffff' }
```

⚠️ **Recommendation**: Migrate to theme-aware options (1-3) for automatic light/dark mode support.

## Available Colors

All 18 colors from `ColorEnum`:
- `red`, `orange`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`
- `blue`, `indigo`, `violet`, `purple`, `magenta`, `pink`
- `brown`, `gray`, `navy`, `default`

## Example: Real-world Usage

```tsx
import { Card, CardContent, Typography } from '@mui/material';
import { useThemeColors } from '../shared/theme/useThemeColors';

function AccountCard({ account }: { account: Account }) {
  const { getColorConfig } = useThemeColors();
  const colorConfig = getColorConfig(account.color);

  return (
    <Card sx={{
      backgroundColor: colorConfig.bgColor,
      color: colorConfig.color,
    }}>
      <CardContent>
        <Typography variant="h5">{account.name}</Typography>
      </CardContent>
    </Card>
  );
}
```

## Benefits of Theme Integration

1. **Consistency**: All color-coded UI elements automatically adapt to the current theme
2. **Accessibility**: Light mode uses lighter backgrounds with dark text for better readability
3. **Maintainability**: Change colors globally by updating theme configuration
4. **Type Safety**: TypeScript prevents typos and shows available colors in autocomplete
