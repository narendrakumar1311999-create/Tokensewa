/**
 * Post Office & Public Holidays List (2025-2027) and Sunday Validation
 */

export const POST_OFFICE_HOLIDAYS_2026: Record<string, { name: string; nameEn: string }> = {
  '2026-01-26': { name: 'गणतंत्र दिवस (Republic Day)', nameEn: 'Republic Day' },
  '2026-02-15': { name: 'महाशिवरात्रि (Maha Shivratri)', nameEn: 'Maha Shivratri' },
  '2026-03-04': { name: 'होली (Holi)', nameEn: 'Holi' },
  '2026-03-21': { name: 'ईद-उल-फितर (Id-ul-Fitr)', nameEn: 'Id-ul-Fitr' },
  '2026-03-31': { name: 'महावीर जयंती (Mahavir Jayanti)', nameEn: 'Mahavir Jayanti' },
  '2026-04-03': { name: 'गुड फ्राइडे (Good Friday)', nameEn: 'Good Friday' },
  '2026-05-01': { name: 'बुद्ध पूर्णिमा (Buddha Purnima)', nameEn: 'Buddha Purnima' },
  '2026-05-28': { name: 'बकरीद / ईद-उल-जुहा (Id-ul-Zuha)', nameEn: 'Id-ul-Zuha' },
  '2026-06-26': { name: 'मोहर्रम (Muharram)', nameEn: 'Muharram' },
  '2026-08-15': { name: 'स्वतंत्रता दिवस (Independence Day)', nameEn: 'Independence Day' },
  '2026-09-04': { name: 'श्रीकृष्ण जन्माष्टमी (Janmashtami)', nameEn: 'Janmashtami' },
  '2026-09-25': { name: 'ईद-ए-मिलाद (Milad-un-Nabi)', nameEn: 'Milad-un-Nabi' },
  '2026-10-02': { name: 'गांधी जयंती (Mahatma Gandhi Birthday)', nameEn: 'Mahatma Gandhi Jayanti' },
  '2026-10-20': { name: 'दशहरा / महानवमी (Mahanavami / Dussehra)', nameEn: 'Dussehra / Navami' },
  '2026-10-21': { name: 'विजयादशमी / दशहरा (Dussehra / Vijayadashami)', nameEn: 'Vijayadashami' },
  '2026-11-08': { name: 'दीपावली (Diwali / Deepavali)', nameEn: 'Diwali' },
  '2026-11-09': { name: 'गोवर्धन पूजा (Govardhan Puja)', nameEn: 'Govardhan Puja' },
  '2026-11-10': { name: 'भैया दूज (Bhai Dooj)', nameEn: 'Bhai Dooj' },
  '2026-11-24': { name: 'गुरु नानक जयंती (Guru Nanak Jayanti)', nameEn: 'Guru Nanak Jayanti' },
  '2026-12-25': { name: 'क्रिसमस (Christmas Day)', nameEn: 'Christmas' },
};

/**
 * Check if a date string (YYYY-MM-DD) falls on a Sunday
 */
export function isSunday(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  // Using UTC to avoid local timezone shifting the day of week
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay() === 0;
}

/**
 * Check whether Post Office / Aadhaar Centre is closed on this date
 */
export function checkPostOfficeClosed(dateStr: string): {
  isClosed: boolean;
  reason?: string;
  isSunday: boolean;
  holidayName?: string;
} {
  if (isSunday(dateStr)) {
    return {
      isClosed: true,
      isSunday: true,
      reason: 'रविवार (साप्ताहिक अवकाश / Sunday Closed)',
      holidayName: 'रविवार साप्ताहिक अवकाश',
    };
  }

  const holiday = POST_OFFICE_HOLIDAYS_2026[dateStr];
  if (holiday) {
    return {
      isClosed: true,
      isSunday: false,
      reason: `डाकघर अवकाश: ${holiday.name}`,
      holidayName: holiday.name,
    };
  }

  return {
    isClosed: false,
    isSunday: false,
  };
}

/**
 * Computes next open working day (skips Sunday and post office holidays)
 */
export function getNextWorkingDay(startDateStr: string): string {
  let [y, m, d] = startDateStr.split('-').map(Number);
  let current = new Date(Date.UTC(y, m - 1, d));

  for (let i = 0; i < 14; i++) {
    current = new Date(current.getTime() + 86400000);
    const dateStr = current.toISOString().split('T')[0];
    const { isClosed } = checkPostOfficeClosed(dateStr);
    if (!isClosed) {
      return dateStr;
    }
  }

  return current.toISOString().split('T')[0];
}
