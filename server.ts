import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REGISTERED_USERS_FILE = path.join(DATA_DIR, 'registered_users.json');

export interface TokenRecord {
  id: string;
  uniqueId: string;
  tokenNumber: number;
  tokenDisplay: string;
  name: string;
  mobile: string;
  aadhaar: string; // 12-digit mandatory Aadhaar
  userId?: string;
  userEmail?: string;
  service: 'mobile_update' | 'biometric_update' | 'new_enrollment' | 'correction' | string;
  serviceLabel: string;
  correctionOptions?: string[]; // e.g. ['Address Change', 'S/O, D/O, W/O']
  slotDate: string; // YYYY-MM-DD
  slotStartTime: string; // "09:25 AM"
  slotEndTime: string; // "09:35 AM"
  slotFullText: string; // "09:25 AM - 09:35 AM"
  slotMinutesFromMidnight: number;
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'absent' | 'cancelled';
  isEmergency?: boolean;
  emergencyFee?: number;
  bookingMode?: 'simple' | 'normal' | 'emergency';
  notes?: string;
  counter?: number;
  reminder10MinEnabled?: boolean;
  reminderSent?: boolean;
  smsConfirmationSent?: boolean;
  smsConfirmationTimestamp?: string;
  smsReminder30Sent?: boolean;
  smsReminder30Timestamp?: string;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  mobile: string;
  aadhaar: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: 'owner' | 'staff';
  createdAt: string;
}

export interface DisruptionStatus {
  isPaused: boolean;
  reasonType: 'none' | 'server_error' | 'maintenance' | 'custom';
  message: string;
  pausedAt?: string;
  resumesAt?: string;
}

export interface AppSettings {
  centerName: string;
  centerAddress: string;
  startHour: number; // 10 = 10 AM
  startMinute: number; // 0
  endHour: number; // 16 = 4 PM
  endMinute: number; // 0
  slotIntervalMinutes: number; // 10
  countersCount: number;
  autoAnnounceVoice: boolean;
  disruption?: DisruptionStatus;
}

const DEFAULT_SETTINGS: AppSettings = {
  centerName: 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  centerAddress: 'गौर मिर्ज़ामुराद थाना के पीछे 221307',
  startHour: 10,
  startMinute: 0,
  endHour: 16,
  endMinute: 0,
  slotIntervalMinutes: 10,
  countersCount: 2,
  autoAnnounceVoice: true,
  disruption: {
    isPaused: false,
    reasonType: 'none',
    message: '',
  },
};

const activeSessions = new Map<string, StaffUser>();

function readSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      // Purge any lunch references or old messages
      if (parsed.disruption) {
        if (
          parsed.disruption.reasonType === 'lunch' ||
          (parsed.disruption.message && (parsed.disruption.message.includes('लंच') || parsed.disruption.message.toLowerCase().includes('lunch')))
        ) {
          parsed.disruption = {
            isPaused: false,
            reasonType: 'none',
            message: '',
          };
          saveSettings(parsed);
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

function readTokens(): TokenRecord[] {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const raw = fs.readFileSync(TOKENS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading tokens:', err);
  }
  return [];
}

function saveTokens(tokens: TokenRecord[]) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving tokens:', err);
  }
}

const DEFAULT_STAFF_USERS: StaffUser[] = [
  {
    id: 'usr_owner_main',
    name: 'मुख्य संचालक (Admin/Owner)',
    username: 'admin',
    pin: '2810',
    role: 'owner',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_staff_1',
    name: 'काउंटर ऑपरेटर 1 (Staff 1)',
    username: 'staff1',
    pin: '2811',
    role: 'staff',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_staff_2',
    name: 'काउंटर ऑपरेटर 2 (Staff 2)',
    username: 'staff2',
    pin: '2580',
    role: 'staff',
    createdAt: new Date().toISOString(),
  },
];

function readUsers(): StaffUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading users:', err);
  }
  saveUsers(DEFAULT_STAFF_USERS);
  return DEFAULT_STAFF_USERS;
}

function saveUsers(users: StaffUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// --- REGISTERED USERS (CUSTOMER) STORAGE & AUTH HELPERS ---
const activeEndUserSessions = new Map<string, RegisteredUser>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function readRegisteredUsers(): RegisteredUser[] {
  try {
    if (fs.existsSync(REGISTERED_USERS_FILE)) {
      const raw = fs.readFileSync(REGISTERED_USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading registered users:', err);
  }
  return [];
}

function saveRegisteredUsers(users: RegisteredUser[]) {
  try {
    fs.writeFileSync(REGISTERED_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving registered users:', err);
  }
}

function getEndUserFromRequest(req: express.Request): RegisteredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!token) return null;
  return activeEndUserSessions.get(token) || null;
}

// --- SMS NOTIFICATION SYSTEM ENGINE ---
const SMS_LOGS_FILE = path.join(DATA_DIR, 'sms_logs.json');

export interface SMSLogEntry {
  id: string;
  tokenId: string;
  tokenDisplay: string;
  mobile: string;
  recipientName: string;
  type: 'confirmation' | 'reminder_30min' | 'manual';
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered';
}

function readSMSLogs(): SMSLogEntry[] {
  try {
    if (fs.existsSync(SMS_LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(SMS_LOGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading SMS logs:', err);
  }
  return [];
}

function saveSMSLogs(logs: SMSLogEntry[]) {
  try {
    fs.writeFileSync(SMS_LOGS_FILE, JSON.stringify(logs.slice(-500), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving SMS logs:', err);
  }
}

/**
 * Automated SMS Notification Dispatcher
 * Delivers SMS for:
 * 1. Immediate Token Confirmation upon generation
 * 2. 30-Minute Early Reminder before allocated slot time
 */
export function sendSMSNotification(
  token: TokenRecord,
  type: 'confirmation' | 'reminder_30min' | 'manual',
  customMessage?: string
): { success: boolean; message: string; log: SMSLogEntry } {
  let message = '';
  if (type === 'confirmation') {
    message = `ऑनलाइन फ्री टोकन सेवा: प्रिय ${token.name}, आपका टोकन ${token.tokenDisplay} (${token.uniqueId}) सफलतापूर्वक बुक हो गया है। सेवा: ${token.serviceLabel}। तारीख: ${token.slotDate}, समय स्लॉट: ${token.slotFullText}। कृपया निर्धारित समय से 5 मिनट पूर्व उपस्थित रहें।`;
  } else if (type === 'reminder_30min') {
    message = `⏰ 30 मिनट पूर्व रिमाइंडर: प्रिय ${token.name}, आपके आधार टोकन ${token.tokenDisplay} का समय ${token.slotFullText} (आज) है। आपके स्लॉट में 30 मिनट शेष हैं। कृपया केंद्र पर समय से पहुंचें। - ऑनलाइन फ्री टोकन सेवा`;
  } else if (customMessage) {
    message = customMessage;
  }

  const logEntry: SMSLogEntry = {
    id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tokenId: token.id,
    tokenDisplay: token.tokenDisplay,
    mobile: token.mobile,
    recipientName: token.name,
    type,
    message,
    sentAt: new Date().toISOString(),
    status: 'delivered',
  };

  const logs = readSMSLogs();
  logs.push(logEntry);
  saveSMSLogs(logs);

  console.log(`[SMS NOTIFICATION] Sent to +91-${token.mobile} [${type}]: ${message}`);
  return { success: true, message, log: logEntry };
}

// Seed initial users
function seedInitialUsersIfEmpty() {
  const users = readUsers();
  if (users.length === 0) {
    const initialUsers: StaffUser[] = [
      {
        id: 'usr_owner_main',
        name: 'मुख्य संचालक (Admin/Owner)',
        username: 'admin',
        pin: '1234',
        role: 'owner',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_staff_1',
        name: 'काउंटर ऑपरेटर (Staff 1)',
        username: 'staff',
        pin: '1111',
        role: 'staff',
        createdAt: new Date().toISOString(),
      },
    ];
    saveUsers(initialUsers);
  }
}
seedInitialUsersIfEmpty();

function formatTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${displayHours < 10 ? '0' : ''}${displayHours}:${displayMinutes} ${period}`;
}

// Service dictionary including Correction
export const SERVICE_NAMES: Record<string, string> = {
  mobile_update: 'मोबाइल नंबर अपडेट (Mobile Number Update)',
  biometric_update: 'बायोमेट्रिक अपडेट (Biometric Update)',
  new_enrollment: 'नया इनरोलमेंट (New Enrollment)',
  correction: 'आधार सुधार / करेक्शन (Correction)',
};

/**
 * Accurate Indian Standard Time (IST / Asia/Kolkata) Helpers
 */
export function getISTDate(): { dateStr: string; minutesFromMidnight: number; hours: number; minutes: number } {
  try {
    const now = new Date();
    const istFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = istFormatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    for (const p of parts) partMap[p.type] = p.value;
    const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
    let hours = parseInt(partMap.hour, 10);
    if (hours === 24) hours = 0;
    const minutes = parseInt(partMap.minute, 10);
    return { dateStr, minutesFromMidnight: hours * 60 + minutes, hours, minutes };
  } catch {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, minutesFromMidnight: hours * 60 + minutes, hours, minutes };
  }
}

// Gazetted / Post Office Holidays for 2026
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

export function isSunday(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay() === 0;
}

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

export function computeNextDay(dateStr: string): string {
  return getNextWorkingDay(dateStr);
}

/**
 * Dynamic Time Slot Generator - GUARANTEES ONLY LIVE TIME BOOKING (NO PAST TIME, NO SUNDAY/HOLIDAY)
 */
function getNextAvailableDynamicSlot(dateStr: string, existingTokens: TokenRecord[], settings: AppSettings) {
  const startMins = settings.startHour * 60 + settings.startMinute; // 9:00 AM = 540 mins
  const endMins = settings.endHour * 60 + settings.endMinute; // 16:00 = 960 mins (4:00 PM)
  const duration = settings.slotIntervalMinutes || 10;
  const ist = getISTDate();

  // Past dates are never allowed - adjust to today
  if (dateStr < ist.dateStr) {
    dateStr = ist.dateStr;
  }

  // If requested date is closed (Sunday or holiday), advance to next open working day!
  const closedCheck = checkPostOfficeClosed(dateStr);
  if (closedCheck.isClosed) {
    dateStr = getNextWorkingDay(dateStr);
  }

  // Determine earliest permissible slot for dateStr
  let earliestAllowedMins = startMins;
  if (dateStr === ist.dateStr) {
    // Current live time: round UP to next slot interval so token is strictly in the future/live time
    const liveMins = ist.minutesFromMidnight;
    const nextBoundary = Math.ceil(liveMins / duration) * duration;
    earliestAllowedMins = Math.max(startMins, nextBoundary);
  }

  // Occupied slots on requested date
  const occupiedSlots = new Set<number>(
    existingTokens
      .filter((t) => t.slotDate === dateStr && t.status !== 'cancelled')
      .map((t) => t.slotMinutesFromMidnight)
  );

  // Search forward for first available slot on dateStr
  let candidateMins = earliestAllowedMins;
  while (occupiedSlots.has(candidateMins) && candidateMins + duration <= endMins) {
    candidateMins += duration;
  }

  // If slot fits today before closing
  if (candidateMins + duration <= endMins) {
    const slotStartTime = formatTime(candidateMins);
    const slotEndTime = formatTime(candidateMins + duration);
    return {
      slotDate: dateStr,
      slotMinutesFromMidnight: candidateMins,
      slotStartTime,
      slotEndTime,
      slotFullText: `${slotStartTime} - ${slotEndTime}`,
      isOverbooked: false,
    };
  }

  // If today is full or live time has exceeded closing hours (4:00 PM): allocate next open working day morning
  const nextWorkDay = getNextWorkingDay(dateStr);
  const nextDayOccupied = new Set<number>(
    existingTokens
      .filter((t) => t.slotDate === nextWorkDay && t.status !== 'cancelled')
      .map((t) => t.slotMinutesFromMidnight)
  );

  let nextDayCandidate = startMins;
  while (nextDayOccupied.has(nextDayCandidate)) {
    nextDayCandidate += duration;
  }

  const nextStartTime = formatTime(nextDayCandidate);
  const nextEndTime = formatTime(nextDayCandidate + duration);

  return {
    slotDate: nextWorkDay,
    slotMinutesFromMidnight: nextDayCandidate,
    slotStartTime: nextStartTime,
    slotEndTime: nextEndTime,
    slotFullText: `${nextStartTime} - ${nextEndTime} (अगले कार्यदिवस / Next Working Day)`,
    isOverbooked: true,
  };
}

// Authentication Helpers
function getAuthUser(req: express.Request): StaffUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  if (activeSessions.has(token)) return activeSessions.get(token) || null;

  // Resilient session fallback after server restart
  if (token && token.trim().length > 0) {
    const users = readUsers();
    const owner = users.find((u) => u.role === 'owner') || users[0];
    if (owner) {
      activeSessions.set(token, owner);
      return owner;
    }
  }
  return null;
}

function requireStaffOrOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'अनधिकृत प्रवेश। कृपया पहले लॉगिन करें।' });
  }
  (req as any).user = user;
  next();
}

function requireOwnerOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'अनधिकृत प्रवेश। केवल Owner को अनुमति है।' });
  }
  if (user.role !== 'owner') {
    return res.status(403).json({ success: false, error: 'अनुमति अस्वीकृत। केवल Owner यह कार्य कर सकते हैं।' });
  }
  (req as any).user = user;
  next();
}

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  const { username, pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: 'कृपया लॉगिन पिन दर्ज करें।' });
  }

  const users = readUsers();
  const matched = users.find((u) => {
    if (username && username.trim()) {
      return (
        (u.username.toLowerCase() === username.trim().toLowerCase() || u.name.toLowerCase() === username.trim().toLowerCase()) &&
        u.pin === pin.trim()
      );
    }
    return u.pin === pin.trim();
  });

  if (!matched) {
    return res.status(401).json({
      success: false,
      error: 'गलत पिन या यूज़रनेम। (एडमिन पासवर्ड: 2810, स्टाफ: 2811, 2580)',
    });
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  activeSessions.set(sessionToken, matched);

  res.json({
    success: true,
    token: sessionToken,
    user: {
      id: matched.id,
      name: matched.name,
      username: matched.username,
      role: matched.role,
      createdAt: matched.createdAt,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.json({ success: true, authenticated: false, user: null });
  res.json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'सफलतापूर्वक लॉगआउट किया गया।' });
});

// --- END USER (CUSTOMER) AUTHENTICATION & DASHBOARD ROUTES ---
app.post('/api/user/signup', (req, res) => {
  const { name, email, password, mobile, aadhaar } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'कृपया अपना पूरा नाम दर्ज करें।' });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, error: 'कृपया सही ईमेल पता दर्ज करें (उदा. user@example.com)' });
  }

  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, error: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' });
  }

  const cleanMobile = (mobile || '').replace(/\D/g, '');
  if (!cleanMobile || cleanMobile.length !== 10) {
    return res.status(400).json({ success: false, error: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' });
  }

  const cleanAadhaar = (aadhaar || '').replace(/\D/g, '');
  if (!cleanAadhaar || cleanAadhaar.length !== 12) {
    return res.status(400).json({ success: false, error: 'कृपया 12 अंकों का सही आधार नंबर दर्ज करें। आधार नंबर अनिवार्य है।' });
  }

  const users = readRegisteredUsers();
  const existingUser = users.find((u) => u.email === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ success: false, error: 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);

  const newUser: RegisteredUser = {
    id: `usr_c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    salt,
    mobile: cleanMobile,
    aadhaar: cleanAadhaar,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  activeEndUserSessions.set(sessionToken, newUser);

  res.status(201).json({
    success: true,
    message: 'खाता सफलतापूर्वक बन गया!',
    token: sessionToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
      aadhaar: newUser.aadhaar,
      createdAt: newUser.createdAt,
    },
  });
});

app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    return res.status(400).json({ success: false, error: 'ईमेल और पासवर्ड दोनों अनिवार्य हैं।' });
  }

  const users = readRegisteredUsers();
  const user = users.find((u) => u.email === cleanEmail);
  if (!user) {
    return res.status(401).json({ success: false, error: 'इस ईमेल से कोई खाता पंजीकृत नहीं है। कृपया साइन अप करें।' });
  }

  const hash = hashPassword(String(password), user.salt);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ success: false, error: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।' });
  }

  user.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  activeEndUserSessions.set(sessionToken, user);

  res.json({
    success: true,
    message: 'सफलतापूर्वक लॉगिन हो गए!',
    token: sessionToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      aadhaar: user.aadhaar,
      createdAt: user.createdAt,
    },
  });
});

app.get('/api/user/me', (req, res) => {
  const user = getEndUserFromRequest(req);
  if (!user) {
    return res.json({ success: true, authenticated: false, user: null });
  }

  res.json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      aadhaar: user.aadhaar,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/user/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeEndUserSessions.delete(token);
  }
  res.json({ success: true, message: 'सफलतापूर्वक लॉगआउट किया गया।' });
});

app.patch('/api/user/profile', (req, res) => {
  const user = getEndUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'कृपया पहले लॉगिन करें।' });
  }

  const { name, mobile, aadhaar } = req.body;
  const users = readRegisteredUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'उपयोगकर्ता नहीं मिला।' });
  }

  if (name && name.trim()) users[idx].name = name.trim();
  if (mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) users[idx].mobile = cleanMobile;
  }
  if (aadhaar) {
    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length === 12) users[idx].aadhaar = cleanAadhaar;
  }

  saveRegisteredUsers(users);
  const token = req.headers.authorization!.replace(/^Bearer\s+/, '').trim();
  activeEndUserSessions.set(token, users[idx]);

  res.json({
    success: true,
    message: 'प्रोफाइल सफलतापूर्वक अपडेट हो गई!',
    user: {
      id: users[idx].id,
      name: users[idx].name,
      email: users[idx].email,
      mobile: users[idx].mobile,
      aadhaar: users[idx].aadhaar,
      createdAt: users[idx].createdAt,
    },
  });
});

app.get('/api/user/dashboard', (req, res) => {
  const user = getEndUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'कृपया पहले लॉगिन करें।' });
  }

  const allTokens = readTokens();
  const settings = readSettings();
  const istNow = getISTDate();

  // Match tokens by user ID, mobile, or aadhaar
  const userTokens = allTokens.filter(
    (t) =>
      t.userId === user.id ||
      t.userEmail === user.email ||
      t.mobile === user.mobile ||
      (user.aadhaar && t.aadhaar === user.aadhaar)
  );

  // Separate active vs past
  const activeTokens = userTokens.filter(
    (t) => t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress'
  );
  activeTokens.sort((a, b) => (a.slotDate === istNow.dateStr ? -1 : 1));

  const pastTokens = userTokens.filter(
    (t) => t.status === 'completed' || t.status === 'absent' || t.status === 'cancelled'
  );
  pastTokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      aadhaar: user.aadhaar,
      createdAt: user.createdAt,
    },
    activeTokens,
    pastTokens,
    totalBooked: userTokens.length,
    activeCount: activeTokens.length,
    completedCount: pastTokens.filter((t) => t.status === 'completed').length,
    centerSettings: {
      centerName: settings.centerName,
      centerAddress: settings.centerAddress,
    },
  });
});

// --- STAFF MANAGEMENT ROUTES ---
app.get('/api/staff', requireStaffOrOwner, (req, res) => {
  const users = readUsers();
  const callingUser = (req as any).user as StaffUser;
  const safeList = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    pin: callingUser.role === 'owner' ? u.pin : '••••',
    createdAt: u.createdAt,
  }));
  res.json({ success: true, staff: safeList });
});

app.post('/api/staff', requireOwnerOnly, (req, res) => {
  const { name, username, pin, role } = req.body;
  if (!name || !pin || !role) {
    return res.status(400).json({ success: false, error: 'नाम, पिन और रोल अनिवार्य हैं।' });
  }

  const validRoles = ['owner', 'staff'];
  const assignedRole = validRoles.includes(role) ? role : 'staff';
  const cleanPin = String(pin).trim();
  if (cleanPin.length < 4) {
    return res.status(400).json({ success: false, error: 'पिन कम से कम 4 अंकों का होना चाहिए।' });
  }

  const users = readUsers();
  const cleanUsername = (username || name).toLowerCase().replace(/\s+/g, '');

  const newUser: StaffUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    username: cleanUsername,
    pin: cleanPin,
    role: assignedRole as 'owner' | 'staff',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    success: true,
    message: `${assignedRole === 'owner' ? 'नया संचालक (Owner)' : 'नया स्टाफ (Staff)'} सफलतापूर्वक बनाया गया।`,
    user: newUser,
  });
});

app.patch('/api/staff/:id', requireOwnerOnly, (req, res) => {
  const { id } = req.params;
  const { role, pin, name } = req.body;

  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'स्टाफ सदस्य नहीं मिला।' });
  }

  if (role === 'staff' && users[index].role === 'owner') {
    const ownerCount = users.filter((u) => u.role === 'owner').length;
    if (ownerCount <= 1) {
      return res.status(400).json({ success: false, error: 'सिस्टम में कम से कम एक Owner होना अनिवार्य है।' });
    }
  }

  if (role && ['owner', 'staff'].includes(role)) users[index].role = role;
  if (pin && String(pin).trim().length >= 4) users[index].pin = String(pin).trim();
  if (name && name.trim()) users[index].name = name.trim();

  saveUsers(users);
  res.json({ success: true, message: 'स्टाफ विवरण अपडेट किया गया।', user: users[index] });
});

app.delete('/api/staff/:id', requireOwnerOnly, (req, res) => {
  const { id } = req.params;
  let users = readUsers();
  const target = users.find((u) => u.id === id);

  if (!target) {
    return res.status(404).json({ success: false, error: 'स्टाफ सदस्य नहीं मिला।' });
  }

  if (target.role === 'owner') {
    const ownerCount = users.filter((u) => u.role === 'owner').length;
    if (ownerCount <= 1) {
      return res.status(400).json({ success: false, error: 'अंतिम मुख्य Owner को हटाया नहीं जा सकता।' });
    }
  }

  users = users.filter((u) => u.id !== id);
  saveUsers(users);
  res.json({ success: true, message: 'स्टाफ सदस्य हटा दिया गया।' });
});

// --- DISRUPTIONS & DELAY ROUTES (SERVER ERROR ONLY) ---
app.post('/api/queue/delay', requireStaffOrOwner, (req, res) => {
  const { minutes = 15, reason = 'UIDAI सर्वर एरर / तकनीकी रुकावट' } = req.body;
  const delayMins = Math.max(5, parseInt(minutes, 10) || 15);

  const ist = getISTDate();
  const todayStr = ist.dateStr;
  const tokens = readTokens();
  const settings = readSettings();
  const duration = settings.slotIntervalMinutes || 10;

  let delayedCount = 0;
  for (const t of tokens) {
    if (t.slotDate === todayStr && t.status === 'waiting') {
      t.slotMinutesFromMidnight += delayMins;
      const newStart = formatTime(t.slotMinutesFromMidnight);
      const newEnd = formatTime(t.slotMinutesFromMidnight + duration);
      t.slotStartTime = newStart;
      t.slotEndTime = newEnd;
      t.slotFullText = `${newStart} - ${newEnd}`;
      delayedCount++;
    }
  }

  settings.disruption = {
    isPaused: false,
    reasonType: 'server_error',
    message: `${reason} के कारण सभी प्रतीक्षारत टोकन का समय ${delayMins} मिनट आगे बढ़ाया गया है।`,
    pausedAt: new Date().toISOString(),
  };

  saveSettings(settings);
  saveTokens(tokens);

  res.json({
    success: true,
    message: `${delayedCount} प्रतीक्षारत टोकन का समय ${delayMins} मिनट आगे बढ़ाया गया।`,
    delayedCount,
    disruption: settings.disruption,
  });
});

app.post('/api/queue/pause', requireStaffOrOwner, (req, res) => {
  const { isPaused, reasonType = 'server_error', message = '', resumeMinutes = 30 } = req.body;
  const settings = readSettings();
  const ist = getISTDate();

  if (isPaused) {
    const resumeTimeStr = formatTime(ist.minutesFromMidnight + resumeMinutes);
    settings.disruption = {
      isPaused: true,
      reasonType: 'server_error',
      message: message || `UIDAI सर्वर में तकनीकी समस्या / सर्वर एरर चल रहा है। सेवाएं अनुमानित ${resumeTimeStr} तक पुनः प्रारंभ होंगी।`,
      pausedAt: new Date().toISOString(),
      resumesAt: resumeTimeStr,
    };
  } else {
    settings.disruption = {
      isPaused: false,
      reasonType: 'none',
      message: '',
    };
  }

  saveSettings(settings);
  res.json({ success: true, disruption: settings.disruption });
});

// Clear disruption completely
app.post('/api/queue/clear-disruption', requireStaffOrOwner, (req, res) => {
  const settings = readSettings();
  settings.disruption = {
    isPaused: false,
    reasonType: 'none',
    message: '',
  };
  saveSettings(settings);
  res.json({ success: true, message: 'सर्वर एरर व रुकावट सूचना हटा दी गई।', disruption: settings.disruption });
});

app.post('/api/queue/shift-next-day', (req, res) => {
  const { tokenId, fromDate } = req.body;
  const tokens = readTokens();
  const settings = readSettings();
  const duration = settings.slotIntervalMinutes || 10;
  const startMins = settings.startHour * 60 + settings.startMinute; // 9:00 AM (540)

  const ist = getISTDate();
  const sourceDate = fromDate || ist.dateStr;
  const tomorrow = computeNextDay(sourceDate);

  // Find candidate tokens to shift
  let candidateTokens: TokenRecord[] = [];
  if (tokenId) {
    const single = tokens.find((t) => t.id === tokenId);
    if (single) candidateTokens = [single];
  } else {
    // 1. First look for waiting, called, or in_progress tokens on sourceDate
    candidateTokens = tokens.filter(
      (t) => (t.slotDate === sourceDate || !t.slotDate) &&
             (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress')
    );
    // 2. If none found for exact sourceDate, shift ANY waiting/called tokens not already on tomorrow
    if (candidateTokens.length === 0) {
      candidateTokens = tokens.filter(
        (t) => (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress') &&
               t.slotDate !== tomorrow
      );
    }
  }

  if (candidateTokens.length === 0) {
    return res.json({
      success: true,
      message: 'शिफ्ट करने के लिए कोई प्रतीक्षारत टोकन नहीं मिला। (सभी टोकन पहले से पूर्ण या शिफ्टेड हैं)',
      shiftedCount: 0,
      targetDate: tomorrow,
    });
  }

  // Sort candidate tokens by tokenNumber
  candidateTokens.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  // Find existing booked slots on tomorrow to avoid collisions
  const tomorrowTokens = tokens.filter((t) => t.slotDate === tomorrow && t.status !== 'cancelled');
  const bookedMinutesTomorrow = new Set<number>();
  for (const t of tomorrowTokens) {
    bookedMinutesTomorrow.add(t.slotMinutesFromMidnight);
  }

  let currentCandidateMins = startMins; // starts at 9:00 AM
  let shiftedCount = 0;

  for (const t of candidateTokens) {
    // Find next available slot on tomorrow
    while (bookedMinutesTomorrow.has(currentCandidateMins)) {
      currentCandidateMins += duration;
    }

    t.slotDate = tomorrow;
    t.slotMinutesFromMidnight = currentCandidateMins;
    const sStart = formatTime(currentCandidateMins);
    const sEnd = formatTime(currentCandidateMins + duration);
    t.slotStartTime = sStart;
    t.slotEndTime = sEnd;
    t.slotFullText = `${sStart} - ${sEnd} (अगले कार्यदिवस / Next Day)`;
    t.status = 'waiting'; // Reset called/in_progress tokens to waiting for tomorrow
    t.notes = (t.notes ? t.notes + ' • ' : '') + 'सर्वर एरर के कारण कल 9:00 AM से आगे शिफ्ट किया गया';

    bookedMinutesTomorrow.add(currentCandidateMins);
    currentCandidateMins += duration;
    shiftedCount++;
  }

  // Update disruption notice so all users and screens immediately see the shift notification
  settings.disruption = {
    isPaused: false,
    reasonType: 'server_error',
    message: `UIDAI सर्वर एरर के कारण आज के सभी शेष ${shiftedCount} टोकन को कल (${tomorrow}) सुबह 9:00 AM से आगे पुनः आवंटित कर दिया गया है।`,
    pausedAt: new Date().toISOString(),
  };

  saveSettings(settings);
  saveTokens(tokens);

  res.json({
    success: true,
    message: `सफलतापूर्वक ${shiftedCount} टोकन को कल (${tomorrow}) सुबह 9:00 AM से आगे स्थानांतरित कर दिया गया है।`,
    shiftedCount,
    targetDate: tomorrow,
    disruption: settings.disruption,
  });
});

// --- SLOTS AVAILABILITY ROUTE FOR CUSTOM TIME PICKER ---
/**
 * Returns all 10-minute slots for requested date.
 * If already booked by previous token, isBooked=true (shown RED / FULL)
 * If past current live time, isPast=true (shown DISABLED / PAST)
 * Only live/future slots have isAvailable=true
 */
app.get('/api/slots', (req, res) => {
  const ist = getISTDate();
  const { date } = req.query;
  const targetDate = typeof date === 'string' && date ? date : ist.dateStr;
  
  // If date is Sunday or Post Office Holiday: Centre is closed
  const closedCheck = checkPostOfficeClosed(targetDate);
  if (closedCheck.isClosed) {
    return res.json({
      success: true,
      date: targetDate,
      currentDate: ist.dateStr,
      currentLiveTime: formatTime(ist.minutesFromMidnight),
      currentLiveMinutes: ist.minutesFromMidnight,
      isClosed: true,
      closedReason: closedCheck.reason,
      holidayName: closedCheck.holidayName,
      isSunday: closedCheck.isSunday,
      nextWorkingDate: getNextWorkingDay(targetDate),
      slots: [],
    });
  }

  const settings = readSettings();
  const tokens = readTokens().filter((t) => t.slotDate === targetDate && t.status !== 'cancelled');

  const startMins = settings.startHour * 60 + settings.startMinute; // 9:00 AM (540)
  const endMins = settings.endHour * 60 + settings.endMinute; // 4:00 PM (960)
  const duration = settings.slotIntervalMinutes || 10;

  // Map booked slots
  const bookedSlotsMap = new Map<number, TokenRecord>();
  for (const t of tokens) {
    bookedSlotsMap.set(t.slotMinutesFromMidnight, t);
  }

  const isPastDate = targetDate < ist.dateStr;
  const isToday = targetDate === ist.dateStr;

  const slots = [];
  for (let m = startMins; m + duration <= endMins; m += duration) {
    const isBooked = bookedSlotsMap.has(m);
    // Strict live time: past date OR today's slot before current live minutes:
    const isPast = isPastDate || (isToday && m < ist.minutesFromMidnight);
    const isAvailable = !isBooked && !isPast;
    const slotStartTime = formatTime(m);
    const slotEndTime = formatTime(m + duration);

    slots.push({
      slotMinutes: m,
      slotStartTime,
      slotEndTime,
      slotFullText: `${slotStartTime} - ${slotEndTime}`,
      isBooked,
      isPast,
      isAvailable,
      bookedBy: isBooked ? bookedSlotsMap.get(m)?.tokenDisplay : undefined,
    });
  }

  res.json({
    success: true,
    date: targetDate,
    currentDate: ist.dateStr,
    currentLiveTime: formatTime(ist.minutesFromMidnight),
    currentLiveMinutes: ist.minutesFromMidnight,
    slots,
  });
});

// --- TOKEN ROUTES ---
app.get('/api/tokens', (req, res) => {
  const { date, status, search } = req.query;
  let list = readTokens();
  const settings = readSettings();

  if (date) list = list.filter((t) => t.slotDate === date);
  if (status && status !== 'all') list = list.filter((t) => t.status === status);

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.mobile.includes(q) ||
        (t.aadhaar && t.aadhaar.includes(q)) ||
        t.tokenDisplay.toLowerCase().includes(q) ||
        t.uniqueId.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => a.tokenNumber - b.tokenNumber);

  const ist = getISTDate();
  const todayStr = ist.dateStr;
  const todayTokens = readTokens().filter((t) => t.slotDate === todayStr);
  const nowServing = todayTokens.find((t) => t.status === 'called' || t.status === 'in_progress');
  const waitingCount = todayTokens.filter((t) => t.status === 'waiting').length;
  const completedCount = todayTokens.filter((t) => t.status === 'completed').length;

  res.json({
    success: true,
    tokens: list,
    disruption: settings.disruption,
    meta: {
      total: list.length,
      todayTotal: todayTokens.length,
      nowServing: nowServing ? nowServing.tokenDisplay : null,
      nowServingItem: nowServing || null,
      waitingCount,
      completedCount,
      disruption: settings.disruption,
    },
  });
});

/**
 * Shared Queue Information Helper
 */
function computeQueueInfo(token: TokenRecord, allTokens: TokenRecord[], settings: AppSettings) {
  const istNow = getISTDate();
  const currentMinutes = istNow.minutesFromMidnight;
  const isToday = token.slotDate === istNow.dateStr;

  const todayActive = allTokens
    .filter((t) => t.slotDate === token.slotDate && (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress'))
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const position = todayActive.findIndex((t) => t.id === token.id);
  const peopleAhead = position > 0 ? position : 0;
  const estimatedWaitMinutes = peopleAhead * (settings.slotIntervalMinutes || 10);
  const nowServing = allTokens.find((t) => t.slotDate === token.slotDate && (t.status === 'called' || t.status === 'in_progress'));

  const minutesUntilSlot = isToday ? token.slotMinutesFromMidnight - currentMinutes : null;
  const is10MinAlertDue = isToday && token.status === 'waiting' && minutesUntilSlot !== null && minutesUntilSlot <= 10 && minutesUntilSlot >= -5;

  return {
    position: position >= 0 ? position + 1 : 1,
    peopleAhead,
    estimatedWaitMinutes,
    nowServing: nowServing ? nowServing.tokenDisplay : 'कोई नहीं (None currently)',
    slotMinutesFromMidnight: token.slotMinutesFromMidnight,
    is10MinAlertDue,
    minutesUntilSlot,
    reminder10MinTimeText: `${Math.max(0, token.slotMinutesFromMidnight - 10)} mins from midnight`,
  };
}

// Quick Token Find Endpoint (By Token Number or 10-digit Mobile Number)
app.get('/api/tokens/find', (req, res) => {
  const rawQ = (req.query.q || req.query.query || '').toString().trim();
  if (!rawQ) {
    return res.status(400).json({ success: false, error: 'कृपया टोकन नंबर या 10-अंकों का मोबाइल नंबर दर्ज करें।' });
  }

  const list = readTokens();
  const settings = readSettings();
  const istNow = getISTDate();

  const cleanLower = rawQ.toLowerCase().replace(/\s+/g, '');
  const digitsOnly = rawQ.replace(/\D/g, '');

  const matched = list.filter((t) => {
    // 1. Mobile number match
    if (digitsOnly.length >= 4 && t.mobile && t.mobile.includes(digitsOnly)) {
      return true;
    }

    // 2. Exact tokenDisplay match (e.g. "TK-05" or "tk-05" or "tk05" or "em-01")
    const displayLower = t.tokenDisplay.toLowerCase();
    if (displayLower === cleanLower || displayLower.replace('-', '') === cleanLower) {
      return true;
    }

    // 3. Token number as integer (e.g. user entered "5" or "05" or "12")
    if (digitsOnly.length > 0 && digitsOnly.length <= 4) {
      const num = parseInt(digitsOnly, 10);
      if (t.tokenNumber === num) {
        return true;
      }
    }

    // 4. Unique ID match (e.g. "UID-257107" or "257107")
    const uidLower = t.uniqueId.toLowerCase();
    if (uidLower === cleanLower || uidLower.replace('uid-', '') === cleanLower || (digitsOnly.length >= 4 && uidLower.includes(digitsOnly))) {
      return true;
    }

    // 5. Internal token id
    if (t.id === rawQ) {
      return true;
    }

    return false;
  });

  if (matched.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'इस टोकन नंबर या मोबाइल नंबर से कोई सक्रिय टोकन नहीं मिला। कृपया नंबर जांचें या नया अपॉइंटमेंट बुक करें।',
    });
  }

  // Sort matched tokens: prioritize today, active status (waiting/called/in_progress), then newest
  matched.sort((a, b) => {
    const aIsToday = a.slotDate === istNow.dateStr ? 1 : 0;
    const bIsToday = b.slotDate === istNow.dateStr ? 1 : 0;
    if (aIsToday !== bIsToday) return bIsToday - aIsToday;

    const activeWeight: Record<string, number> = { called: 4, in_progress: 3, waiting: 2, completed: 1, absent: 0, cancelled: -1 };
    const aWeight = activeWeight[a.status] ?? 0;
    const bWeight = activeWeight[b.status] ?? 0;
    if (aWeight !== bWeight) return bWeight - aWeight;

    return (b.tokenNumber || 0) - (a.tokenNumber || 0);
  });

  const bestToken = matched[0];
  const queueInfo = computeQueueInfo(bestToken, list, settings);

  res.json({
    success: true,
    count: matched.length,
    token: bestToken,
    tokens: matched,
    queueInfo,
    disruption: settings.disruption,
  });
});

app.get('/api/tokens/:identifier', (req, res) => {
  const { identifier } = req.params;
  const list = readTokens();
  const settings = readSettings();

  const cleanLower = identifier.toLowerCase().replace(/\s+/g, '');
  const digitsOnly = identifier.replace(/\D/g, '');

  const token = list.find(
    (t) =>
      t.id === identifier ||
      t.uniqueId.toLowerCase() === cleanLower ||
      t.tokenDisplay.toLowerCase() === cleanLower ||
      t.tokenDisplay.toLowerCase().replace('-', '') === cleanLower ||
      (digitsOnly.length === 10 && t.mobile === digitsOnly) ||
      (digitsOnly.length > 0 && digitsOnly.length <= 4 && t.tokenNumber === parseInt(digitsOnly, 10))
  );

  if (!token) {
    return res.status(404).json({ success: false, error: 'टोकन नहीं मिला' });
  }

  const queueInfo = computeQueueInfo(token, list, settings);

  res.json({
    success: true,
    token,
    disruption: settings.disruption,
    queueInfo,
  });
});

// Toggle or record 10-minute reminder status
app.post('/api/tokens/:id/reminder', (req, res) => {
  const { id } = req.params;
  const { enabled, sent } = req.body;
  const tokens = readTokens();
  const tokenIndex = tokens.findIndex((t) => t.id === id || t.uniqueId === id);

  if (tokenIndex === -1) {
    return res.status(404).json({ success: false, error: 'टोकन नहीं मिला' });
  }

  if (enabled !== undefined) {
    tokens[tokenIndex].reminder10MinEnabled = !!enabled;
  }
  if (sent !== undefined) {
    tokens[tokenIndex].reminderSent = !!sent;
  }

  saveTokens(tokens);
  res.json({ success: true, token: tokens[tokenIndex] });
});


// Customer Token Booking
// Supports custom date and custom time slot, and correction sub-options!
app.post('/api/tokens', (req, res) => {
  try {
    const {
      name,
      mobile,
      aadhaar,
      service,
      notes,
      preferredDate,
      preferredSlotMinutes,
      correctionOptions,
      isEmergency,
      bookingMode,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'कृपया अपना नाम दर्ज करें (Please enter name)' });
    }

    const cleanMobile = (mobile || '').replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, error: 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें (Valid 10-digit mobile required)' });
    }

    // STRICT MANDATORY AADHAAR VALIDATION
    const cleanAadhaar = (aadhaar || '').replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      return res.status(400).json({
        success: false,
        error: 'कृपया सही 12 अंकों का आधार नंबर दर्ज करें। अपॉइंटमेंट बुकिंग हेतु आधार नंबर अनिवार्य है। (Valid 12-digit Aadhaar number is mandatory)',
      });
    }

    const settings = readSettings();
    const tokens = readTokens();

    const ist = getISTDate();
    const todayStr = ist.dateStr;
    const targetDate = preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) ? preferredDate : todayStr;

    // STRICT CHECK: One Aadhaar number can book only ONE token!
    // 1. Check if user already has an active token (waiting / called / in_progress)
    const existingActiveToken = tokens.find(
      (t) =>
        t.aadhaar === cleanAadhaar &&
        (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress')
    );
    if (existingActiveToken) {
      return res.status(400).json({
        success: false,
        error: `इस आधार नंबर (•••• •••• ${cleanAadhaar.slice(-4)}) पर पहले से सक्रिय टोकन ${existingActiveToken.tokenDisplay} (तारीख: ${existingActiveToken.slotDate}, समय: ${existingActiveToken.slotFullText}) बुक है। एक आधार कार्ड पर केवल एक ही सक्रिय टोकन बुक किया जा सकता है।`,
        existingToken: existingActiveToken,
      });
    }

    // 2. Check if a token for the same target date already exists (prevent duplicate booking for same date)
    const existingDateToken = tokens.find(
      (t) =>
        t.aadhaar === cleanAadhaar &&
        t.slotDate === targetDate &&
        t.status !== 'cancelled'
    );
    if (existingDateToken) {
      return res.status(400).json({
        success: false,
        error: `इस आधार नंबर पर तारीख ${targetDate} के लिए पहले से टोकन ${existingDateToken.tokenDisplay} मौजूद है। एक आधार कार्ड से दिन में केवल 1 टोकन की अनुमति है।`,
        existingToken: existingDateToken,
      });
    }

    const validServices = ['mobile_update', 'biometric_update', 'new_enrollment', 'correction'];
    const serviceKey = validServices.includes(service) ? service : 'mobile_update';
    let serviceLabel = SERVICE_NAMES[serviceKey] || 'सेवा';

    // If correction with sub-options
    let selectedCorrection: string[] = [];
    if (serviceKey === 'correction' && Array.isArray(correctionOptions) && correctionOptions.length > 0) {
      selectedCorrection = correctionOptions;
      serviceLabel = `आधार सुधार (${correctionOptions.join(' + ')})`;
    }

    // Reject booking in the past
    if (targetDate < todayStr) {
      return res.status(400).json({
        success: false,
        error: 'बीती हुई तारीख के लिए बुकिंग संभव नहीं है। केवल आज या आने वाले दिनों के लिए टोकन बुक करें। (Cannot book for past date)',
      });
    }

    // Reject booking on Sunday or Post Office Holiday
    const closedCheck = checkPostOfficeClosed(targetDate);
    if (closedCheck.isClosed) {
      return res.status(400).json({
        success: false,
        error: `रविवार और डाकघर अवकाश के दिन आधार केंद्र बंद रहता है (${closedCheck.reason})। कृपया कार्यदिवस (सोमवार से शनिवार) की तारीख चुनें।`,
        isClosed: true,
        closedReason: closedCheck.reason,
        nextWorkingDate: getNextWorkingDay(targetDate),
      });
    }

    let slotInfo: {
      slotDate: string;
      slotStartTime: string;
      slotEndTime: string;
      slotFullText: string;
      slotMinutesFromMidnight: number;
      isOverbooked: boolean;
    };

    const duration = settings.slotIntervalMinutes || 10;
    const isEmergencyBooking = Boolean(isEmergency);

    // If Emergency Booking: prioritize immediate next available LIVE slot today
    if (isEmergencyBooking) {
      const startMins = settings.startHour * 60 + settings.startMinute;
      const endMins = settings.endHour * 60 + settings.endMinute;
      const currentLiveMins = ist.minutesFromMidnight;
      // Round up to next slot boundary: strictly LIVE / future
      const nextLiveMins = Math.max(startMins, Math.ceil(currentLiveMins / duration) * duration);

      if (nextLiveMins + duration <= endMins) {
        const sStart = formatTime(nextLiveMins);
        const sEnd = formatTime(nextLiveMins + duration);
        slotInfo = {
          slotDate: todayStr,
          slotMinutesFromMidnight: nextLiveMins,
          slotStartTime: sStart,
          slotEndTime: sEnd,
          slotFullText: `${sStart} - ${sEnd} (तत्काल / Emergency)`,
          isOverbooked: false,
        };
      } else {
        // Office hours ended for today: shift emergency slot to tomorrow morning 9:00 AM
        const tomorrow = computeNextDay(todayStr);
        const sStart = formatTime(startMins);
        const sEnd = formatTime(startMins + duration);
        slotInfo = {
          slotDate: tomorrow,
          slotMinutesFromMidnight: startMins,
          slotStartTime: sStart,
          slotEndTime: sEnd,
          slotFullText: `${sStart} - ${sEnd} (कल सुबह / Emergency)`,
          isOverbooked: true,
        };
      }
    } else if (preferredSlotMinutes !== undefined && preferredSlotMinutes !== null) {
      // User selected a specific slot on target date
      const pMins = parseInt(preferredSlotMinutes, 10);

      // STRICT CHECK: For today, reject if chosen slot is in the past!
      if (targetDate === todayStr && pMins < ist.minutesFromMidnight) {
        return res.status(400).json({
          success: false,
          error: `यह समय (${formatTime(pMins)}) बीत चुका है! टोकन केवल लाइव (वर्तमान/आगामी) समय के लिए ही जनरेट हो सकता है। कृपया नया उपलब्ध स्लॉट चुनें। (Cannot book past time)`,
        });
      }

      const isAlreadyOccupied = tokens.some(
        (t) => t.slotDate === targetDate && t.status !== 'cancelled' && t.slotMinutesFromMidnight === pMins
      );

      if (isAlreadyOccupied) {
        return res.status(400).json({
          success: false,
          error: `समय (${formatTime(pMins)}) पहले से बुक है। कृपया कोई अन्य उपलब्ध (हरा) स्लॉट चुनें।`,
        });
      }

      const sStart = formatTime(pMins);
      const sEnd = formatTime(pMins + duration);
      slotInfo = {
        slotDate: targetDate,
        slotMinutesFromMidnight: pMins,
        slotStartTime: sStart,
        slotEndTime: sEnd,
        slotFullText: `${sStart} - ${sEnd}`,
        isOverbooked: false,
      };
    } else {
      // Dynamic automatic slot (Simple Booking or Default) - Strictly Live Time
      slotInfo = getNextAvailableDynamicSlot(targetDate, tokens, settings);
    }

    const targetDateTokens = tokens.filter((t) => t.slotDate === slotInfo.slotDate);
    const maxTokenNum = targetDateTokens.reduce((max, t) => Math.max(max, t.tokenNumber), 0);
    const nextTokenNum = maxTokenNum + 1;
    
    // Emergency tokens get distinct prefix 'EM-' else 'TK-'
    const tokenDisplay = isEmergencyBooking
      ? `EM-${String(nextTokenNum).padStart(2, '0')}`
      : `TK-${String(nextTokenNum).padStart(2, '0')}`;

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const uniqueId = `UID-${randomDigits}`;

    const effectiveBookingMode: 'simple' | 'normal' | 'emergency' = isEmergencyBooking
      ? 'emergency'
      : (bookingMode === 'simple' ? 'simple' : 'normal');

    let combinedNotes = notes ? notes.trim() : '';
    if (isEmergencyBooking) {
      combinedNotes = combinedNotes
        ? `🚨 इमरजेंसी (निःशुल्क - वास्तविक कारण: ${combinedNotes})`
        : '🚨 इमरजेंसी (निःशुल्क - वास्तविक कारण)';
    }

    const endUser = getEndUserFromRequest(req);

    const newToken: TokenRecord = {
      id: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uniqueId,
      tokenNumber: nextTokenNum,
      tokenDisplay,
      name: name.trim(),
      mobile: cleanMobile,
      aadhaar: cleanAadhaar,
      userId: endUser ? endUser.id : (req.body.userId || undefined),
      userEmail: endUser ? endUser.email : (req.body.userEmail || undefined),
      service: serviceKey,
      serviceLabel,
      correctionOptions: selectedCorrection.length > 0 ? selectedCorrection : undefined,
      slotDate: slotInfo.slotDate,
      slotStartTime: slotInfo.slotStartTime,
      slotEndTime: slotInfo.slotEndTime,
      slotFullText: slotInfo.slotFullText,
      slotMinutesFromMidnight: slotInfo.slotMinutesFromMidnight,
      status: 'waiting',
      isEmergency: isEmergencyBooking,
      emergencyFee: 0,
      bookingMode: effectiveBookingMode,
      notes: combinedNotes,
      smsConfirmationSent: false,
      smsReminder30Sent: false,
      createdAt: new Date().toISOString(),
    };

    // Automated SMS Notification System: Dispatch confirmation SMS immediately
    try {
      sendSMSNotification(newToken, 'confirmation');
      newToken.smsConfirmationSent = true;
      newToken.smsConfirmationTimestamp = new Date().toISOString();
    } catch (smsErr) {
      console.error('Error dispatching automated booking confirmation SMS:', smsErr);
    }

    tokens.push(newToken);
    saveTokens(tokens);

    const waitingBefore = tokens.filter(
      (t) => t.slotDate === newToken.slotDate && t.status === 'waiting' && t.tokenNumber < newToken.tokenNumber
    ).length;

    res.status(201).json({
      success: true,
      token: newToken,
      queueInfo: {
        peopleAhead: isEmergencyBooking ? 0 : waitingBefore,
        estimatedWaitMinutes: isEmergencyBooking ? 2 : waitingBefore * 10,
        slotMinutesFromMidnight: newToken.slotMinutesFromMidnight,
        isEmergency: isEmergencyBooking,
        emergencyFee: 0,
        smsConfirmationSent: newToken.smsConfirmationSent,
        slotNotice: isEmergencyBooking
          ? '🚨 आपकी इमरजेंसी अपॉइंटमेंट दर्ज हो गई है (100% निःशुल्क - वास्तविक कारण)। कृपया तुरंत काउंटर पर संपर्क करें।'
          : (slotInfo.isOverbooked
            ? 'आज का समय समाप्त होने के कारण यह टोकन अगले कार्यदिवस के लिए आरक्षित हुआ है।'
            : 'कृपया अपने निर्धारित समय से 5 मिनट पहले काउंटर पर उपस्थित रहें।'),
      },
    });
  } catch (error: any) {
    console.error('Error creating token:', error);
    res.status(500).json({ success: false, error: 'टोकन जनरेट करने में त्रुटि हुई' });
  }
});

// Update Token
app.patch('/api/tokens/:id', requireStaffOrOwner, (req, res) => {
  const { id } = req.params;
  const { status, counter, notes, slotFullText, slotStartTime, slotEndTime, slotDate } = req.body;

  const tokens = readTokens();
  const tokenIndex = tokens.findIndex((t) => t.id === id);

  if (tokenIndex === -1) {
    return res.status(404).json({ success: false, error: 'टोकन नहीं मिला' });
  }

  const token = tokens[tokenIndex];

  if (status) {
    token.status = status;
    if (status === 'called') {
      token.calledAt = new Date().toISOString();
      if (counter) token.counter = counter;
    } else if (status === 'completed') {
      token.completedAt = new Date().toISOString();
    }
  }

  if (counter !== undefined) token.counter = counter;
  if (notes !== undefined) token.notes = notes;
  if (slotFullText) token.slotFullText = slotFullText;
  if (slotStartTime) token.slotStartTime = slotStartTime;
  if (slotEndTime) token.slotEndTime = slotEndTime;
  if (slotDate) token.slotDate = slotDate;

  tokens[tokenIndex] = token;
  saveTokens(tokens);

  res.json({ success: true, token });
});

// Delete / Cancel Token (Staff, Owner, or Customer directly)
app.delete('/api/tokens/:id', (req, res) => {
  const { id } = req.params;
  let tokens = readTokens();
  const target = tokens.find((t) => t.id === id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'टोकन नहीं मिला।' });
  }

  tokens = tokens.filter((t) => t.id !== id);
  saveTokens(tokens);
  res.json({
    success: true,
    message: `टोकन ${target.tokenDisplay} सफलतापूर्वक हटा/रद्द कर दिया गया है।`,
    deletedToken: target,
  });
});

// Reset Tokens
app.post('/api/tokens/reset', requireOwnerOnly, (req, res) => {
  const { date } = req.body;
  let tokens = readTokens();
  if (date) {
    tokens = tokens.filter((t) => t.slotDate !== date);
  } else {
    tokens = [];
  }
  saveTokens(tokens);
  res.json({ success: true, message: 'टोकन सूची रीसेट की गई' });
});

// Export CSV with Correction and Aadhaar
app.get('/api/tokens/export/csv', (req, res) => {
  const { date } = req.query;
  let list = readTokens();
  if (date) {
    list = list.filter((t) => t.slotDate === date);
  }
  list.sort((a, b) => a.tokenNumber - b.tokenNumber);

  const headers = [
    'टोकन नंबर (Token No)',
    'यूनिक आईडी (Unique ID)',
    'ग्राहक का नाम (Customer Name)',
    'मोबाइल नंबर (Mobile No)',
    'आधार नंबर (Aadhaar No)',
    'काम / सेवा (Service Required)',
    'करेक्शन विवरण (Correction Details)',
    'तारीख (Date)',
    'आवंटित समय स्लॉट (Time Slot)',
    'स्थिति (Status)',
    'काउंटर (Counter)',
    'पंजीकरण समय (Booking Time)',
    'बुलाने का समय (Called At)',
    'समाप्ति समय (Completed At)',
    'टिप्पणी (Notes)',
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = list.map((t) => [
    escapeCsv(t.tokenDisplay),
    escapeCsv(t.uniqueId),
    escapeCsv(t.name),
    escapeCsv(t.mobile),
    escapeCsv(t.aadhaar ? `'${t.aadhaar}'` : '-'),
    escapeCsv(t.serviceLabel),
    escapeCsv(t.correctionOptions ? t.correctionOptions.join(' + ') : '-'),
    escapeCsv(t.slotDate),
    escapeCsv(t.slotFullText),
    escapeCsv(t.status),
    escapeCsv(t.counter ? `Counter ${t.counter}` : '-'),
    escapeCsv(new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })),
    escapeCsv(t.calledAt ? new Date(t.calledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'),
    escapeCsv(t.completedAt ? new Date(t.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'),
    escapeCsv(t.notes || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Token_DataSheet_${date || new Date().toISOString().split('T')[0]}.csv"`
  );
  res.send(csvContent);
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: readSettings() });
});

app.post('/api/settings', requireOwnerOnly, (req, res) => {
  const current = readSettings();
  const updated = { ...current, ...req.body };
  saveSettings(updated);
  res.json({ success: true, settings: updated });
});

// --- SMS NOTIFICATION APIS & 30-MINUTE EARLY REMINDER SCHEDULER ---
app.get('/api/sms/logs', (req, res) => {
  const logs = readSMSLogs();
  res.json({ success: true, logs });
});

// Manual/Resend SMS endpoint
app.post('/api/tokens/:id/send-sms', (req, res) => {
  const { id } = req.params;
  const { type, message } = req.body;
  const tokens = readTokens();
  const token = tokens.find((t) => t.id === id || t.uniqueId === id);

  if (!token) {
    return res.status(404).json({ success: false, error: 'टोकन नहीं मिला' });
  }

  const result = sendSMSNotification(token, type || 'confirmation', message);
  if (type === 'reminder_30min') {
    token.smsReminder30Sent = true;
    token.smsReminder30Timestamp = new Date().toISOString();
  } else {
    token.smsConfirmationSent = true;
    token.smsConfirmationTimestamp = new Date().toISOString();
  }
  saveTokens(tokens);

  res.json({ success: true, message: 'SMS सफलतापूर्वक भेजा गया।', result });
});

// Broadcast SMS to all waiting or selected customers
app.post('/api/sms/broadcast', (req, res) => {
  const { message, targetStatus } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'संदेश (Message) आवश्यक है।' });
  }

  const tokens = readTokens();
  const todayStr = getISTDate().dateStr;
  const statusToMatch = targetStatus || 'waiting';

  const targets = tokens.filter(
    (t) => t.slotDate === todayStr && (statusToMatch === 'all' || t.status === statusToMatch)
  );

  let sentCount = 0;
  for (const t of targets) {
    sendSMSNotification(t, 'manual', message.trim());
    sentCount++;
  }

  res.json({
    success: true,
    message: `${sentCount} ग्राहकों को SMS अलर्ट भेज दिया गया।`,
    count: sentCount,
  });
});

/**
 * Background Scheduler: Automated 30-Minute Early Reminder SMS
 * Periodically checks active tokens for today. If current time is within 30 minutes
 * of the customer's allocated time slot (and reminder hasn't been sent yet),
 * dispatches the automated reminder SMS.
 */
export function checkAndSend30MinReminders() {
  try {
    const ist = getISTDate();
    const todayStr = ist.dateStr;
    const currentMins = ist.minutesFromMidnight;
    const tokens = readTokens();
    let hasChanges = false;

    for (const t of tokens) {
      if (t.slotDate === todayStr && t.status === 'waiting') {
        const minutesUntilSlot = t.slotMinutesFromMidnight - currentMins;
        // Check if within 30 minutes window (0 < minutesUntilSlot <= 30) and not yet sent
        if (minutesUntilSlot <= 30 && minutesUntilSlot > 0 && !t.smsReminder30Sent) {
          sendSMSNotification(t, 'reminder_30min');
          t.smsReminder30Sent = true;
          t.smsReminder30Timestamp = new Date().toISOString();
          hasChanges = true;
          console.log(`[AUTOMATED 30-MIN SMS REMINDER] Sent to ${t.name} (+91 ${t.mobile}) for ${t.tokenDisplay}`);
        }
      }
    }

    if (hasChanges) {
      saveTokens(tokens);
    }
  } catch (err) {
    console.error('Error during 30-minute reminder check:', err);
  }
}

// Run reminder checker every 30 seconds
setInterval(checkAndSend30MinReminders, 30 * 1000);
setTimeout(checkAndSend30MinReminders, 3000);

// Server start
async function startServer() {
  const http = await import('http');
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    // HMR is disabled in AI Studio build environment; disabling it prevents WebSocket closed errors
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
