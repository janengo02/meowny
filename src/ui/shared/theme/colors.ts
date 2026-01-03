/**
 * Color configuration with dark background and white text colors
 *
 * NOTE: These are fallback values for dark mode.
 * For theme-aware colors that automatically switch between light and dark modes,
 * use theme.palette.customColors instead (e.g., theme.palette.customColors.red).
 *
 * Example usage with theme:
 * ```tsx
 * import { useTheme } from '@mui/material';
 *
 * const theme = useTheme();
 * const redColors = theme.palette.customColors.red;
 *
 * <Box sx={{
 *   backgroundColor: (theme) => theme.palette.customColors.red.bgColor,
 *   color: (theme) => theme.palette.customColors.red.color
 * }} />
 * ```
 */
export const COLOR_HEX_MAP: Record<
  ColorEnum,
  { bgColor: string; color: string }
> = {
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
};

/**
 * Get background color for a ColorEnum value
 */
export function getColorHex(color: ColorEnum): string {
  return COLOR_HEX_MAP[color].bgColor;
}

/**
 * Get text color for a ColorEnum value
 */
export function getTextColor(color: ColorEnum): string {
  return COLOR_HEX_MAP[color].color;
}

/**
 * Get both background and text colors for a ColorEnum value
 */
export function getColorConfig(color: ColorEnum): {
  bgColor: string;
  color: string;
} {
  return COLOR_HEX_MAP[color];
}

/**
 * Array of all available colors for selection
 */
export const AVAILABLE_COLORS: ColorEnum[] = [
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'magenta',
  'pink',
  'brown',
  'gray',
  'navy',
  'default',
];
