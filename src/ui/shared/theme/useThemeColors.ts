import { useTheme as useMuiTheme } from '@mui/material';

/**
 * Hook to get theme-aware colors that automatically switch between light and dark modes
 *
 * @example
 * ```tsx
 * const { getColorConfig } = useThemeColors();
 * const redConfig = getColorConfig('red');
 *
 * <Box sx={{
 *   backgroundColor: redConfig.bgColor,
 *   color: redConfig.color
 * }} />
 * ```
 *
 * @example
 * ```tsx
 * // Or use directly in sx prop
 * <Box sx={{
 *   backgroundColor: (theme) => theme.palette.customColors.red.bgColor,
 *   color: (theme) => theme.palette.customColors.red.color
 * }} />
 * ```
 */
export const useThemeColors = () => {
  const theme = useMuiTheme();

  /**
   * Get theme-aware color configuration for a given ColorEnum
   * Returns colors that automatically adapt to light/dark mode
   */
  const getColorConfig = (color: ColorEnum): { bgColor: string; color: string } => {
    return theme.palette.customColors[color];
  };

  /**
   * Get just the background color
   */
  const getBgColor = (color: ColorEnum): string => {
    return theme.palette.customColors[color].bgColor;
  };

  /**
   * Get just the text color
   */
  const getTextColor = (color: ColorEnum): string => {
    return theme.palette.customColors[color].color;
  };

  return {
    getColorConfig,
    getBgColor,
    getTextColor,
    customColors: theme.palette.customColors,
  };
};
