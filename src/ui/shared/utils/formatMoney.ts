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

export function sanitizeMoneyInput(input: string): number {
  const cleanValue = input.replace(/[^0-9.-]/g, '');
  const sanitizedAmount = parseFloat(cleanValue || '0');
  return sanitizedAmount;
}
