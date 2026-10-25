/**
 * Date and Time utilities for 10-minute slots and Hindi formatting (IST / Live Time)
 */

export function getTodayDateString(): string {
  try {
    const now = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return istFormatter.format(now);
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function getCurrentISTTime(): { hours: number; minutes: number; minutesFromMidnight: number; timeString: string } {
  try {
    const now = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = istFormatter.formatToParts(now);
    let hours = 0;
    let minutes = 0;
    for (const p of parts) {
      if (p.type === 'hour') hours = parseInt(p.value, 10);
      if (p.type === 'minute') minutes = parseInt(p.value, 10);
    }
    if (hours === 24) hours = 0;
    const minutesFromMidnight = hours * 60 + minutes;
    const timeString = formatTimeFromMinutes(minutesFromMidnight);
    return { hours, minutes, minutesFromMidnight, timeString };
  } catch {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const minutesFromMidnight = hours * 60 + minutes;
    return { hours, minutes, minutesFromMidnight, timeString: formatTimeFromMinutes(minutesFromMidnight) };
  }
}

export function isSlotInPast(slotMinutes: number, dateStr: string): boolean {
  const todayStr = getTodayDateString();
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const { minutesFromMidnight } = getCurrentISTTime();
  return slotMinutes < minutesFromMidnight;
}

export function formatReadableDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString('hi-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeFromMinutes(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${displayHours < 10 ? '0' : ''}${displayHours}:${displayMinutes} ${period}`;
}

export function getHindiTimeDescription(fullText: string): string {
  // e.g. "09:10 AM - 09:20 AM"
  return fullText
    .replace('AM', 'सुबह')
    .replace('PM', 'दोपहर/शाम');
}
