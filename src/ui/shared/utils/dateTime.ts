import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

/**
 * Gets the current date and time in Tokyo timezone
 * @returns ISO string formatted to datetime-local input format (YYYY-MM-DDTHH:mm:ss)
 */
export function getTokyoDateTime(): string {
  const now = new Date();

  // Get Tokyo time components using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value || '';

  const year = getValue('year');
  const month = getValue('month');
  const day = getValue('day');
  const hour = getValue('hour');
  const minute = getValue('minute');
  const second = getValue('second');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Formats a date string to ISO datetime-local format (yyyy-MM-ddTHH:mm:ss)
 * If the date doesn't contain time info, it defaults to 00:00:00
 */
export const formatToDateTimeLocal = (dateString: string): string => {
  if (!dateString) return '';

  try {
    // Try to parse the date string
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return '';
    }

    // Format to yyyy-MM-ddTHH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return '';
  }
};

/**
 * Formats a date string to ISO date format (yyyy-MM-dd)
 */
export const formatToDateOnly = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return '';
  }
};

/**
 * Converts a date string to Tokyo timezone and formats it for datetime-local input
 * @param dateString - Date string from database (ISO format or similar)
 * @returns Date string in Tokyo timezone formatted as YYYY-MM-DDTHH:mm:ss
 */
export function formatToTokyoDateTime(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return '';
    }

    // Get Tokyo time components using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getValue = (type: string) =>
      parts.find((part) => part.type === type)?.value || '';

    const year = getValue('year');
    const month = getValue('month');
    const day = getValue('day');
    const hour = getValue('hour');
    const minute = getValue('minute');
    const second = getValue('second');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  } catch (error) {
    console.error(
      `Error formatting date to Tokyo timezone: ${dateString}`,
      error,
    );
    return '';
  }
}

export const formatDateForDB = (date: string | Date | Dayjs): string => {
  if (!date) return '';
  const formattedDate = dayjs(date);
  if (!formattedDate.isValid()) {
    return '';
  }
  return formattedDate.toISOString();
};
