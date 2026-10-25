/**
 * GitHub Pages Client-Side Universal Adapter
 * Enables full offline and static hosting on GitHub Pages (or any static CDN)
 * by intercepting /api/* requests with client-side localStorage persistence
 * and cross-tab real-time BroadcastChannel synchronization.
 */

import { TokenRecord, AppSettings, StaffUser, TokenStatus } from '../types';
import { getTodayDateString, getCurrentISTTime, formatTimeFromMinutes } from './time';
import { checkPostOfficeClosed, getNextWorkingDay } from './holidays';

const STORAGE_KEY_TOKENS = 'ghp_tokens_store_v1';
const STORAGE_KEY_SETTINGS = 'ghp_settings_store_v1';
const STORAGE_KEY_USERS = 'ghp_users_store_v1';
const STORAGE_KEY_SMS = 'ghp_sms_store_v1';

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

const DEFAULT_USERS: StaffUser[] = [
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

let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('smart_token_queue_sync');
  }
} catch {
  // ignore
}

function broadcastUpdate(type: string, data?: any) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, data, timestamp: Date.now() });
    } catch {}
  }
}

// Data store helpers
function getStoredTokens(): TokenRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKENS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredTokens(tokens: TokenRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    broadcastUpdate('tokens_updated');
  } catch {}
}

function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveStoredSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    broadcastUpdate('settings_updated');
  } catch {}
}

function getStoredUsers(): StaffUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  saveStoredUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

function saveStoredUsers(users: StaffUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {}
}

function getNextTokenNumber(): number {
  const tokens = getStoredTokens();
  const maxNumber = tokens.reduce((max, t) => Math.max(max, t.tokenNumber || 0), 0);
  return maxNumber + 1;
}

function calculateNextSlot(dateStr: string, existingTokens: TokenRecord[], settings: AppSettings, isEmergency = false) {
  const startMins = settings.startHour * 60 + settings.startMinute;
  const endMins = settings.endHour * 60 + settings.endMinute;
  const duration = settings.slotIntervalMinutes || 10;
  const todayStr = getTodayDateString();
  const isToday = dateStr === todayStr;

  let earliestAllowedMins = startMins;
  if (isToday) {
    const { minutesFromMidnight } = getCurrentISTTime();
    earliestAllowedMins = Math.max(startMins, minutesFromMidnight + 2);
    // Align to slot boundary
    const remainder = (earliestAllowedMins - startMins) % duration;
    if (remainder !== 0) {
      earliestAllowedMins += duration - remainder;
    }
  }

  // Emergency: immediate or next slot
  if (isEmergency) {
    const slotStartTime = formatTimeFromMinutes(earliestAllowedMins);
    const slotEndTime = formatTimeFromMinutes(earliestAllowedMins + duration);
    return {
      slotDate: dateStr,
      slotMinutesFromMidnight: earliestAllowedMins,
      slotStartTime,
      slotEndTime,
      slotFullText: `${slotStartTime} - ${slotEndTime} (🚨 तत्काल / Immediate)`,
      isOverbooked: false,
    };
  }

  const occupiedSlots = new Set<number>(
    existingTokens
      .filter((t) => t.slotDate === dateStr && t.status !== 'cancelled')
      .map((t) => t.slotMinutesFromMidnight)
  );

  let candidateMins = earliestAllowedMins;
  while (occupiedSlots.has(candidateMins) && candidateMins + duration <= endMins) {
    candidateMins += duration;
  }

  if (candidateMins + duration <= endMins) {
    const slotStartTime = formatTimeFromMinutes(candidateMins);
    const slotEndTime = formatTimeFromMinutes(candidateMins + duration);
    return {
      slotDate: dateStr,
      slotMinutesFromMidnight: candidateMins,
      slotStartTime,
      slotEndTime,
      slotFullText: `${slotStartTime} - ${slotEndTime}`,
      isOverbooked: false,
    };
  }

  // Today is full, allocate next open working day
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

  const nextStartTime = formatTimeFromMinutes(nextDayCandidate);
  const nextEndTime = formatTimeFromMinutes(nextDayCandidate + duration);

  return {
    slotDate: nextWorkDay,
    slotMinutesFromMidnight: nextDayCandidate,
    slotStartTime: nextStartTime,
    slotEndTime: nextEndTime,
    slotFullText: `${nextStartTime} - ${nextEndTime} (अगले कार्यदिवस / Next Working Day)`,
    isOverbooked: true,
  };
}

function calculateQueueMeta(tokens: TokenRecord[], settings: AppSettings) {
  const todayStr = getTodayDateString();
  const todayTokens = tokens.filter((t) => t.slotDate === todayStr);

  const activeCalledOrProgress = todayTokens.find((t) => t.status === 'called' || t.status === 'in_progress');
  const nowServing = activeCalledOrProgress ? activeCalledOrProgress.tokenDisplay : null;
  const nowServingItem = activeCalledOrProgress || null;
  const waitingCount = todayTokens.filter((t) => t.status === 'waiting').length;
  const completedCount = todayTokens.filter((t) => t.status === 'completed').length;

  return {
    total: tokens.length,
    todayTotal: todayTokens.length,
    nowServing,
    nowServingItem,
    waitingCount,
    completedCount,
    disruption: settings.disruption,
  };
}

const SERVICE_LABELS: Record<string, string> = {
  mobile_update: 'मोबाइल नंबर लिंक / अपडेट (Mobile Update)',
  biometric_update: 'बायोमेट्रिक अपडेट (Biometric Update)',
  new_enrollment: 'नया इनरोलमेंट (New Enrollment)',
  correction: 'आधार सुधार (Correction / Update)',
};

/**
 * Handle static mock responses when backend is unavailable
 */
async function handleMockApi(path: string, options: RequestInit = {}): Promise<Response | null> {
  const method = (options.method || 'GET').toUpperCase();
  const cleanPath = path.split('?')[0];
  const urlObj = new URL(path, window.location.origin);
  const searchParams = urlObj.searchParams;

  const createJsonResponse = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // 1. GET /api/tokens
  if (cleanPath === '/api/tokens' && method === 'GET') {
    const tokens = getStoredTokens();
    const settings = getStoredSettings();
    const dateQuery = searchParams.get('date');
    const searchQuery = searchParams.get('search');

    let filtered = [...tokens];
    if (dateQuery) {
      filtered = filtered.filter((t) => t.slotDate === dateQuery);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.mobile.includes(q) ||
          t.tokenDisplay.toLowerCase().includes(q) ||
          (t.aadhaar && t.aadhaar.includes(q))
      );
    }

    filtered.sort((a, b) => b.tokenNumber - a.tokenNumber);
    const meta = calculateQueueMeta(tokens, settings);

    return createJsonResponse({
      success: true,
      tokens: filtered,
      meta,
      queueInfo: {
        nowServing: meta.nowServing,
        waitingCount: meta.waitingCount,
        disruption: settings.disruption,
      },
    });
  }

  // 2. POST /api/tokens (Booking)
  if (cleanPath === '/api/tokens' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch {}

    const { name, mobile, aadhaar, service, correctionOptions, slotDate, isEmergency, notes, reminder10MinEnabled } = body;

    // Validate Aadhaar (Mandatory 12 digits)
    const cleanAadhaar = (aadhaar || '').replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      return createJsonResponse({
        success: false,
        error: 'कृपया सही 12 अंकों का आधार नंबर दर्ज करें। अपॉइंटमेंट बुकिंग हेतु आधार नंबर अनिवार्य है।',
      }, 400);
    }

    const cleanMobile = (mobile || '').replace(/\D/g, '');
    if (!name || cleanMobile.length !== 10) {
      return createJsonResponse({
        success: false,
        error: 'कृपया सही नाम और 10 अंकों का मोबाइल नंबर दर्ज करें।',
      }, 400);
    }

    const tokens = getStoredTokens();
    const settings = getStoredSettings();
    const targetDate = slotDate || getTodayDateString();

    // Check duplicate active Aadhaar
    const duplicateAadhaar = tokens.find(
      (t) =>
        t.aadhaar === cleanAadhaar &&
        (t.status === 'waiting' || t.status === 'called' || t.status === 'in_progress' || t.slotDate === targetDate)
    );

    if (duplicateAadhaar) {
      return createJsonResponse({
        success: false,
        error: `इस आधार नंबर (•••• •••• ${cleanAadhaar.slice(-4)}) पर पहले से सक्रिय टोकन ${duplicateAadhaar.tokenDisplay} बुक है। 1 आधार कार्ड पर केवल 1 ही सक्रिय टोकन बुक किया जा सकता है।`,
        existingToken: duplicateAadhaar,
      }, 400);
    }

    const nextNum = getNextTokenNumber();
    const tokenDisplay = `TK-${nextNum < 10 ? '0' : ''}${nextNum}`;
    const uniqueId = `UID-${Math.floor(100000 + Math.random() * 900000)}`;

    const slotInfo = calculateNextSlot(targetDate, tokens, settings, Boolean(isEmergency));

    let serviceLabel = SERVICE_LABELS[service] || 'आधार सेवा';
    if (service === 'correction' && Array.isArray(correctionOptions) && correctionOptions.length > 0) {
      serviceLabel += ` (${correctionOptions.join(' + ')})`;
    }

    const newToken: TokenRecord = {
      id: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uniqueId,
      tokenNumber: nextNum,
      tokenDisplay,
      name: name.trim(),
      mobile: cleanMobile,
      aadhaar: cleanAadhaar,
      service,
      serviceLabel,
      correctionOptions: Array.isArray(correctionOptions) ? correctionOptions : undefined,
      slotDate: slotInfo.slotDate,
      slotStartTime: slotInfo.slotStartTime,
      slotEndTime: slotInfo.slotEndTime,
      slotFullText: slotInfo.slotFullText,
      slotMinutesFromMidnight: slotInfo.slotMinutesFromMidnight,
      status: 'waiting',
      isEmergency: Boolean(isEmergency),
      emergencyFee: isEmergency ? 50 : undefined,
      bookingMode: isEmergency ? 'emergency' : slotDate ? 'normal' : 'simple',
      notes: notes || undefined,
      counter: 1,
      reminder10MinEnabled: Boolean(reminder10MinEnabled),
      createdAt: new Date().toISOString(),
    };

    tokens.push(newToken);
    saveStoredTokens(tokens);

    const meta = calculateQueueMeta(tokens, settings);

    return createJsonResponse({
      success: true,
      message: `टोकन ${tokenDisplay} सफलतापूर्वक जनरेट हो गया!`,
      token: newToken,
      queueInfo: {
        nowServing: meta.nowServing,
        waitingCount: meta.waitingCount,
        disruption: settings.disruption,
      },
    }, 201);
  }

  // 3. GET /api/tokens/:id
  const tokenMatch = cleanPath.match(/^\/api\/tokens\/([a-zA-Z0-9_-]+)$/);
  if (tokenMatch) {
    const tokenId = tokenMatch[1];
    const tokens = getStoredTokens();
    const settings = getStoredSettings();
    const token = tokens.find((t) => t.id === tokenId || t.tokenDisplay.toLowerCase() === tokenId.toLowerCase());

    if (method === 'GET') {
      if (!token) return createJsonResponse({ success: false, error: 'टोकन नहीं मिला।' }, 404);
      const meta = calculateQueueMeta(tokens, settings);
      return createJsonResponse({
        success: true,
        token,
        queueInfo: {
          nowServing: meta.nowServing,
          waitingCount: meta.waitingCount,
          disruption: settings.disruption,
        },
      });
    }

    if (method === 'PATCH') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch {}
      if (!token) return createJsonResponse({ success: false, error: 'टोकन नहीं मिला।' }, 404);

      if (body.status) token.status = body.status as TokenStatus;
      if (typeof body.counter === 'number') token.counter = body.counter;
      if (body.status === 'called') token.calledAt = new Date().toISOString();
      if (body.status === 'completed') token.completedAt = new Date().toISOString();

      saveStoredTokens(tokens);
      return createJsonResponse({ success: true, token });
    }

    if (method === 'DELETE') {
      const remaining = tokens.filter((t) => t.id !== tokenId);
      saveStoredTokens(remaining);
      return createJsonResponse({ success: true, message: 'टोकन सफलतापूर्वक हटा दिया गया।' });
    }
  }

  // 4. GET /api/slots
  if (cleanPath === '/api/slots' && method === 'GET') {
    const dateStr = searchParams.get('date') || getTodayDateString();
    const settings = getStoredSettings();
    const closed = checkPostOfficeClosed(dateStr);

    if (closed.isClosed) {
      return createJsonResponse({
        success: true,
        date: dateStr,
        isClosed: true,
        closedReason: closed.reason,
        isSunday: closed.isSunday,
        holidayName: closed.holidayName,
        nextWorkingDate: getNextWorkingDay(dateStr),
        slots: [],
      });
    }

    const tokens = getStoredTokens();
    const occupied = new Set<number>(
      tokens.filter((t) => t.slotDate === dateStr && t.status !== 'cancelled').map((t) => t.slotMinutesFromMidnight)
    );

    const startMins = settings.startHour * 60 + settings.startMinute;
    const endMins = settings.endHour * 60 + settings.endMinute;
    const duration = settings.slotIntervalMinutes || 10;
    const todayStr = getTodayDateString();
    const isToday = dateStr === todayStr;

    const slots = [];
    for (let m = startMins; m + duration <= endMins; m += duration) {
      const isBooked = occupied.has(m);
      const isPast = isToday && m < getCurrentISTTime().minutesFromMidnight;
      slots.push({
        slotMinutes: m,
        slotStartTime: formatTimeFromMinutes(m),
        slotEndTime: formatTimeFromMinutes(m + duration),
        slotFullText: `${formatTimeFromMinutes(m)} - ${formatTimeFromMinutes(m + duration)}`,
        isBooked,
        isPast,
        isAvailable: !isBooked && !isPast,
      });
    }

    return createJsonResponse({
      success: true,
      date: dateStr,
      isClosed: false,
      slots,
      currentLiveTime: getCurrentISTTime().timeString,
    });
  }

  // 5. GET / POST /api/settings
  if (cleanPath === '/api/settings') {
    if (method === 'GET') {
      return createJsonResponse({ success: true, settings: getStoredSettings() });
    }
    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch {}
      const updated = { ...getStoredSettings(), ...body };
      saveStoredSettings(updated);
      return createJsonResponse({ success: true, settings: updated });
    }
  }

  // 6. POST /api/auth/login
  if (cleanPath === '/api/auth/login' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch {}
    const { username, pin } = body;
    const users = getStoredUsers();

    const matched = users.find((u) => {
      if (username && username.trim()) {
        return (
          (u.username.toLowerCase() === username.trim().toLowerCase() ||
            u.name.toLowerCase() === username.trim().toLowerCase()) &&
          u.pin === String(pin).trim()
        );
      }
      return u.pin === String(pin).trim();
    });

    if (!matched) {
      return createJsonResponse({
        success: false,
        error: 'गलत पिन या यूज़रनेम। (एडमिन पासवर्ड: 2810, स्टाफ: 2811, 2580)',
      }, 401);
    }

    const token = `token_ghp_${Date.now()}`;
    return createJsonResponse({
      success: true,
      token,
      user: {
        id: matched.id,
        name: matched.name,
        username: matched.username,
        role: matched.role,
        createdAt: matched.createdAt,
      },
    });
  }

  // 7. GET /api/auth/me
  if (cleanPath === '/api/auth/me') {
    const authHeader = (options.headers as any)?.Authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const users = getStoredUsers();
      return createJsonResponse({ success: true, authenticated: true, user: users[0] });
    }
    return createJsonResponse({ success: true, authenticated: false, user: null });
  }

  // 8. GET / POST /api/staff
  if (cleanPath === '/api/staff') {
    if (method === 'GET') {
      return createJsonResponse({ success: true, staff: getStoredUsers() });
    }
    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(options.body as string);
      } catch {}
      const users = getStoredUsers();
      const newUser: StaffUser = {
        id: `usr_${Date.now()}`,
        name: body.name || 'स्टाफ ऑपरेटर',
        username: body.username || `staff${users.length + 1}`,
        pin: body.pin || '2811',
        role: body.role || 'staff',
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveStoredUsers(users);
      return createJsonResponse({ success: true, user: newUser });
    }
  }

  // 9. POST /api/tokens/reset
  if (cleanPath === '/api/tokens/reset' && method === 'POST') {
    saveStoredTokens([]);
    return createJsonResponse({ success: true, message: 'सभी टोकन सफलतापूर्वक रीसेट कर दिए गए।' });
  }

  // 10. SMS Simulation
  if (cleanPath.includes('/send-sms') || cleanPath === '/api/sms/broadcast') {
    return createJsonResponse({ success: true, message: 'SMS सूचना सफलतापूर्वक भेज दी गई!' });
  }
  if (cleanPath === '/api/sms/logs') {
    return createJsonResponse({ success: true, logs: [] });
  }

  return null;
}

/**
 * Initializes the GitHub Pages fetch interceptor
 */
export function initGitHubPagesAdapter() {
  if (typeof window === 'undefined') return;

  // Only activate client-side mock adapter when running on GitHub Pages (github.io)
  // or local file:// environment without an active Node backend.
  const isGitHubPages =
    window.location.hostname.endsWith('github.io') ||
    window.location.protocol === 'file:' ||
    sessionStorage.getItem('ghp_offline_mode') === 'true';

  if (!isGitHubPages) {
    // In live backend environments (AI Studio, Cloud Run, Render, VPS), do not alter window.fetch
    return;
  }

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;

    const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes('/api/')) {
        const apiPath = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;
        const mockRes = await handleMockApi(apiPath, init);
        if (mockRes) return mockRes;
      }

      if (originalFetch) {
        return originalFetch(input, init);
      }
      return new Response(JSON.stringify({ success: false, error: 'Endpoint not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    // Safely apply customFetch without triggering "Cannot set property fetch of #<Window> which has only a getter"
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        configurable: true,
        writable: true,
      });
    } catch {
      try {
        (window as any).fetch = customFetch;
      } catch {
        try {
          Object.defineProperty(Window.prototype, 'fetch', {
            value: customFetch,
            configurable: true,
            writable: true,
          });
        } catch {}
      }
    }

    console.log('[TokenQueue] GitHub Pages client-side storage adapter active.');
  } catch (err) {
    console.warn('[TokenQueue] Could not initialize GitHub Pages adapter:', err);
  }
}
