interface FormatMoneyOptions {
  currency?: string;
  decimals?: number;
  showSign?: boolean;
}

/**
 * Formats a numeric value as currency
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatMoney(
  value: number,
  options: FormatMoneyOptions = {},
): string {
  const { currency = '￥', decimals = 0, showSign = false } = options;

  const sign = showSign && value > 0 ? '+' : '';
  const formattedValue = value
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${sign}${currency}${formattedValue}`;
}

/**
 * Formats a percentage value
 * @param value - The numeric value to format as percentage
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to show + sign for positive values (default: false)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  decimals: number = 2,
  showSign: boolean = false,
): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formats a unit amount with thousands separators and up to 4 decimal places
 * Trailing zeros in the decimal part are removed
 * @param value - The numeric value to format
 * @returns Formatted unit string
 */
export function formatUnits(value: number): string {
  // Format with 4 decimal places
  const formatted = value.toFixed(4);

  // Remove trailing zeros after decimal point
  const withoutTrailingZeros = formatted.replace(/\.?0+$/, '');

  // Add thousands separators
  const [integerPart, decimalPart] = withoutTrailingZeros.split('.');
  const withSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decimalPart ? `${withSeparators}.${decimalPart}` : withSeparators;
}

export function sanitizeMoneyInput(input: string): number {
  const cleanValue = input.replace(/[^0-9.-]/g, '');
  const sanitizedAmount = parseFloat(cleanValue || '0');
  return sanitizedAmount;
}
