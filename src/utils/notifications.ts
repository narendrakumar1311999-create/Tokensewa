/**
 * Browser-based Push Notifications and 10-Minute Reminder Scheduler
 */
import { TokenRecord } from '../types';
import { playChime, playUrgentAlarm, triggerVibration } from './audio';

export type NotificationSupportStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationSupportStatus(): NotificationSupportStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationSupportStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Display a push notification using either ServiceWorkerRegistration or native Notification
 */
export async function showPushNotification(title: string, options: {
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: any;
  requireInteraction?: boolean;
}) {
  const defaultOptions: any = {
    body: options.body,
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/pwa-192x192.png',
    vibrate: options.vibrate || [300, 100, 300, 100, 500],
    tag: options.tag || 'token-queue-reminder',
    renotify: true,
    requireInteraction: options.requireInteraction ?? true,
    data: options.data || { url: window.location.href },
  };

  // Try Service Worker registration first (standard PWA way)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    } catch (e) {
      console.warn('Service worker showNotification failed, using fallback:', e);
    }
  }

  // Fallback to standard Notification constructor if supported
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, defaultOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn('Native Notification fallback error:', e);
    }
  }

  return false;
}

// Active scheduled timer IDs mapped by token ID
const scheduledTimers = new Map<string, any>();

/**
 * Schedule a 10-minute early reminder for a specific token
 */
export function scheduleToken10MinAlert(
  token: TokenRecord,
  onTrigger?: (title: string, body: string) => void
) {
  // Clear any existing timer for this token
  if (scheduledTimers.has(token.id)) {
    clearTimeout(scheduledTimers.get(token.id));
    scheduledTimers.delete(token.id);
  }

  if (token.status === 'completed' || token.status === 'cancelled') {
    return null;
  }

  // Calculate target reminder time (10 minutes before slot start time)
  const slotMinutes = token.slotMinutesFromMidnight;
  const reminderMinutes = Math.max(0, slotMinutes - 10);

  const targetDate = new Date();
  if (token.slotDate) {
    const [y, m, d] = token.slotDate.split('-').map(Number);
    targetDate.setFullYear(y, m - 1, d);
  }
  targetDate.setHours(Math.floor(reminderMinutes / 60), reminderMinutes % 60, 0, 0);

  const now = new Date();
  const timeUntilAlertMs = targetDate.getTime() - now.getTime();

  const title = `⏰ टोकन समय अलर्ट (10 मिनट शेष): ${token.tokenDisplay}`;
  const body = `प्रिय ${token.name}, आपके स्लॉट (${token.slotFullText}) में केवल 10 मिनट बाकी हैं! कृपया काउंटर के समीप तैयार रहें।`;

  // Trigger function
  const fireAlert = async () => {
    // 1. Browser Push Notification
    if (getNotificationSupportStatus() === 'granted') {
      await showPushNotification(title, {
        body,
        tag: `token-10min-${token.id}`,
        vibrate: [300, 100, 300, 100, 600],
        requireInteraction: true,
      });
    }

    // 2. Play sound chime and vibration
    playChime();
    triggerVibration();

    // 3. Optional UI callback
    if (onTrigger) {
      onTrigger(title, body);
    }

    // Remove from map
    scheduledTimers.delete(token.id);
  };

  if (timeUntilAlertMs <= 0) {
    // If the token's 10-minute window is already here (or less than 10 mins away)
    // Check if slot has already passed
    const slotStartDate = new Date();
    if (token.slotDate) {
      const [y, m, d] = token.slotDate.split('-').map(Number);
      slotStartDate.setFullYear(y, m - 1, d);
    }
    slotStartDate.setHours(Math.floor(slotMinutes / 60), slotMinutes % 60, 0, 0);

    const timeUntilSlotMs = slotStartDate.getTime() - now.getTime();
    if (timeUntilSlotMs > 0 && timeUntilSlotMs <= 10 * 60 * 1000) {
      // It is currently within the 10-minute pre-slot window!
      return {
        alreadyDue: true,
        minutesRemaining: Math.ceil(timeUntilSlotMs / 60000),
        fireNow: fireAlert,
      };
    }
    return null;
  }

  // Schedule timer
  const timerId = setTimeout(fireAlert, timeUntilAlertMs);
  scheduledTimers.set(token.id, timerId);

  return {
    scheduled: true,
    timeUntilAlertMs,
    targetDate,
    minutesUntilAlert: Math.round(timeUntilAlertMs / 60000),
  };
}

/**
 * Cancel a scheduled reminder
 */
export function cancelToken10MinAlert(tokenId: string) {
  if (scheduledTimers.has(tokenId)) {
    clearTimeout(scheduledTimers.get(tokenId));
    scheduledTimers.delete(tokenId);
  }
}

/**
 * Test notification helper
 */
export async function sendTestNotification(token: TokenRecord) {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return { success: false, permission: perm };
  }

  const title = `🔔 टेस्ट अलर्ट: टोकन ${token.tokenDisplay}`;
  const body = `यह एक टेस्ट नोटिफिकेशन है। आपका स्लॉट ${token.slotFullText} को है। 10 मिनट पहले इसी प्रकार अलर्ट भेजा जाएगा!`;

  await showPushNotification(title, {
    body,
    tag: `test-reminder-${Date.now()}`,
    vibrate: [200, 100, 200, 100, 400],
  });

  playChime();
  triggerVibration();

  return { success: true, permission: perm };
}
