/**
 * Gets the current date and time in Tokyo timezone
 * @returns ISO string formatted to datetime-local input format (YYYY-MM-DDTHH:mm:ss)
 */
export function getTokyoDateTime(): string {
  const now = new Date();
  const tokyoTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
  );
  return tokyoTime.toISOString().slice(0, 19);
}
