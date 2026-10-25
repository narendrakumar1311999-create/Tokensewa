import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Clock,
  CheckCircle2,
  Share2,
  Printer,
  Bell,
  BellRing,
  RefreshCw,
  User,
  Phone,
  FileText,
  Calendar,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  Hourglass,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  Vibrate,
  FileEdit,
  ShieldCheck,
  Check,
  Trash2,
  MessageSquare,
  Send,
  Smartphone
} from 'lucide-react';
import { TokenRecord, DisruptionStatus } from '../types';
import { playChime, playUrgentAlarm, stopUrgentAlarm, triggerVibration } from '../utils/audio';
import {
  getNotificationSupportStatus,
  requestNotificationPermission,
  scheduleToken10MinAlert,
  sendTestNotification,
  showPushNotification,
  NotificationSupportStatus,
} from '../utils/notifications';

interface TokenSlipProps {
  token: TokenRecord;
  queueInfo?: {
    peopleAhead: number;
    estimatedWaitMinutes: number;
    slotNotice?: string;
    slotMinutesFromMidnight?: number;
    is10MinAlertDue?: boolean;
    minutesUntilSlot?: number | null;
  };
  centerName?: string;
  disruption?: DisruptionStatus;
  onReset: () => void;
}

export const TokenSlip: React.FC<TokenSlipProps> = ({
  token: initialToken,
  queueInfo: initialQueueInfo,
  centerName = 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  disruption,
  onReset,
}) => {
  const [token, setToken] = useState<TokenRecord>(initialToken);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [peopleAhead, setPeopleAhead] = useState<number>(initialQueueInfo?.peopleAhead ?? 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPlayedCallAlert, setHasPlayedCallAlert] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // 10-Minute Reminder & Push Notification State
  const [notifStatus, setNotifStatus] = useState<NotificationSupportStatus>('default');
  const [is10MinReminderActive, setIs10MinReminderActive] = useState<boolean>(true);
  const [hasTriggered10MinAlert, setHasTriggered10MinAlert] = useState<boolean>(false);
  const [is10MinAlertBannerOpen, setIs10MinAlertBannerOpen] = useState<boolean>(false);
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isPast: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: false });

  // Automated SMS Status & Resend
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  const handleResendSMS = async (type: 'confirmation' | 'reminder_30min') => {
    setIsSendingSMS(true);
    setSmsFeedback(null);
    try {
      const res = await fetch(`/api/tokens/${token.id}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsFeedback(
          type === 'confirmation'
            ? '✅ पुष्टिकरण SMS पुनः भेज दिया गया है (+91 ' + token.mobile + ')'
            : '✅ 30 मिनट पूर्व रिमाइंडर SMS भेज दिया गया है (+91 ' + token.mobile + ')'
        );
        if (type === 'reminder_30min') {
          setToken((prev) => ({ ...prev, smsReminder30Sent: true, smsReminder30Timestamp: new Date().toISOString() }));
        } else {
          setToken((prev) => ({ ...prev, smsConfirmationSent: true, smsConfirmationTimestamp: new Date().toISOString() }));
        }
      } else {
        setSmsFeedback(data.error || 'SMS भेजने में विफलता हुई।');
      }
    } catch {
      setSmsFeedback('सर्वर से संपर्क नहीं हो पाया।');
    } finally {
      setIsSendingSMS(false);
      setTimeout(() => setSmsFeedback(null), 4000);
    }
  };

  const getNativeSMSBody = () => {
    return encodeURIComponent(
      `ऑनलाइन फ्री टोकन सेवा: प्रिय ${token.name}, आपका टोकन ${token.tokenDisplay} (${token.uniqueId}) स्लॉट ${token.slotFullText} तारीख ${token.slotDate} को है। सेवा: ${token.serviceLabel}।`
    );
  };

  // Initialize notification permission status
  useEffect(() => {
    setNotifStatus(getNotificationSupportStatus());
  }, []);

  // WhatsApp message generator
  const getWhatsAppMessage = () => {
    const liveLink = `${window.location.origin}?token=${token.uniqueId}`;
    return (
      `*डिजिटल टोकन पर्ची - ${centerName}*\n\n` +
      `🎫 *टोकन नंबर:* ${token.tokenDisplay}` + (token.isEmergency ? ` 🚨 (इमरजेंसी टोकन)\n` : `\n`) +
      `🆔 *यूनिक ग्राहक ID:* ${token.uniqueId}\n` +
      `👤 *नाम:* ${token.name}\n` +
      (token.aadhaar ? `🪪 *आधार नंबर:* •••• •••• ${token.aadhaar.slice(-4)}\n` : '') +
      (token.isEmergency ? `⚡ *प्रकार:* इमरजेंसी अपॉइंटमेंट (VIP Priority)\n🆓 *शुल्क:* निःशुल्क (100% Free - वास्तविक कारण आधार)\n` : '') +
      `⏰ *आवंटित समय:* ${token.slotFullText}\n` +
      `📅 *तारीख:* ${token.slotDate}\n` +
      `🛠️ *सेवा:* ${token.serviceLabel}\n` +
      (token.correctionOptions ? `✏️ *सुधार:* ${token.correctionOptions.join(' + ')}\n` : '') +
      `\n⏳ *लाइव टाइमर व 10 मिनट पहले नोटिफिकेशन लिंक:* \n${liveLink}\n\n` +
      `🔔 *सूचना:* समय से ठीक 10 मिनट पहले आपके मोबाइल पर नोटिफिकेशन व घंटी बजेगी ताकि आप सही समय पर पहुंच सकें।`
    );
  };

  // Generate QR Code for token verification
  useEffect(() => {
    const verifyUrl = `${window.location.origin}?token=${token.uniqueId}`;
    QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [token]);

  // Handle scheduling the 10-minute alert
  useEffect(() => {
    if (!is10MinReminderActive || hasTriggered10MinAlert) return;

    const result = scheduleToken10MinAlert(token, (title, body) => {
      setIs10MinAlertBannerOpen(true);
      setHasTriggered10MinAlert(true);
    });

    if (result && 'alreadyDue' in result && result.alreadyDue && !hasTriggered10MinAlert) {
      // Slot is within 10 minutes right now!
      setIs10MinAlertBannerOpen(true);
      setHasTriggered10MinAlert(true);
      playChime();
      triggerVibration();
      if (getNotificationSupportStatus() === 'granted') {
        showPushNotification(`⏰ 10 मिनट शेष: टोकन ${token.tokenDisplay}`, {
          body: `प्रिय ${token.name}, आपके स्लॉट (${token.slotFullText}) में 10 मिनट से भी कम समय बाकी है! कृपया केंद्र के पास रहें।`,
          vibrate: [300, 100, 300, 100, 500],
        });
      }
    }
  }, [token, is10MinReminderActive, hasTriggered10MinAlert]);

  // Countdown timer
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const slotMins = token.slotMinutesFromMidnight;
      const targetDate = new Date();
      if (token.slotDate) {
        const [y, m, d] = token.slotDate.split('-').map(Number);
        targetDate.setFullYear(y, m - 1, d);
      }
      targetDate.setHours(Math.floor(slotMins / 60), slotMins % 60, 0, 0);

      const diffMs = targetDate.getTime() - now.getTime();
      const totalSec = Math.floor(diffMs / 1000);

      if (totalSec <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: true });
      } else {
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        setTimeLeft({ hours, minutes, seconds, totalSeconds: totalSec, isPast: false });

        // If exactly entering the 10-minute alert window (600 seconds)
        if (totalSec <= 600 && totalSec > 0 && !hasTriggered10MinAlert && is10MinReminderActive) {
          setHasTriggered10MinAlert(true);
          setIs10MinAlertBannerOpen(true);
          playChime();
          triggerVibration();
          showPushNotification(`⏰ 10 मिनट शेष: टोकन ${token.tokenDisplay}`, {
            body: `प्रिय ${token.name}, आपका समय ${token.slotFullText} को है। अगले 10 मिनट में काउंटर पर पहुंचे!`,
            vibrate: [300, 100, 300, 100, 500],
          });
        }
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, [token, hasTriggered10MinAlert, is10MinReminderActive]);

  // Status Polling, 10-Minute Alert Trigger & Turn Call Alert
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tokens/${token.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.token) {
            setToken(data.token);
            if (data.queueInfo) {
              setPeopleAhead(data.queueInfo.peopleAhead);

              // 10-MINUTE ALERT TRIGGER FROM SERVER LOGIC
              if (
                data.queueInfo.is10MinAlertDue &&
                !hasTriggered10MinAlert &&
                is10MinReminderActive
              ) {
                setHasTriggered10MinAlert(true);
                setIs10MinAlertBannerOpen(true);
                playChime();
                triggerVibration();
                showPushNotification(`⏰ 10 मिनट पूर्व चेतावनी: टोकन ${data.token.tokenDisplay}`, {
                  body: `प्रिय ${data.token.name}, आपका समय ${data.token.slotFullText} को है। कृपया 10 मिनट के अंदर काउंटर के पास पहुंच जाएं।`,
                  vibrate: [300, 100, 300, 100, 500],
                });
              }
            }

            // TURN ARRIVAL: URGENT ALARM & VIBRATION
            if (data.token.status === 'called' && !hasPlayedCallAlert) {
              playUrgentAlarm(8);
              triggerVibration();
              setIsAlarmPlaying(true);
              setHasPlayedCallAlert(true);
              showPushNotification(`🚨 आपकी बारी आ गई है: टोकन ${data.token.tokenDisplay}`, {
                body: `प्रिय ${data.token.name}, तुरंत काउंटर ${data.token.counter || 1} पर संपर्क करें!`,
                vibrate: [500, 150, 500, 150, 800],
                requireInteraction: true,
              });
            }
          }
        }
      } catch (e) {
        // ignore background poll errors
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      stopUrgentAlarm();
    };
  }, [token.id, hasPlayedCallAlert, hasTriggered10MinAlert, is10MinReminderActive]);

  const handleStopAlarm = () => {
    stopUrgentAlarm();
    setIsAlarmPlaying(false);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/tokens/${token.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setToken(data.token);
          if (data.queueInfo) setPeopleAhead(data.queueInfo.peopleAhead);
          if (data.token.status === 'called' && !hasPlayedCallAlert) {
            playUrgentAlarm(8);
            triggerVibration();
            setIsAlarmPlaying(true);
            setHasPlayedCallAlert(true);
          }
        }
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDirectWhatsApp = () => {
    const message = getWhatsAppMessage();
    const cleanMobile = token.mobile.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Delete / Cancel Token directly by customer
  const handleDeleteToken = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tokens/${token.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onReset();
      }
    } catch (err) {
      console.error('Delete token error:', err);
    } finally {
      setIsDeleting(false);
      setShowConfirmCancel(false);
    }
  };

  // Enable Notifications Flow
  const handleEnableNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotifStatus(perm);
    if (perm === 'granted') {
      setIs10MinReminderActive(true);
      setTestNotifMessage('✅ नोटिफिकेशन अनुमति प्राप्त हो गई! 10 मिनट पूर्व अलर्ट सक्रिय है।');
      setTimeout(() => setTestNotifMessage(null), 4000);

      // Register server reminder preference
      try {
        await fetch(`/api/tokens/${token.id}/reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
        });
      } catch (e) {
        // ignore error
      }
    } else if (perm === 'denied') {
      setTestNotifMessage('⚠️ नोटिफिकेशन ब्लॉक है। कृपया ब्राउज़र सेटिंग्स में जाकर अनुमति (Allow) दें।');
    }
  };

  // Test Notification Flow
  const handleTestNotification = async () => {
    const res = await sendTestNotification(token);
    setNotifStatus(res.permission);
    if (res.success) {
      setTestNotifMessage('🔔 टेस्ट नोटिफिकेशन सफलतापूर्वक भेजा गया!');
    } else {
      setTestNotifMessage('⚠️ नोटिफिकेशन अनुमति नहीं मिली। कृपया "Allow" पर क्लिक करें।');
    }
    setTimeout(() => setTestNotifMessage(null), 4500);
  };

  const getStatusBadge = () => {
    switch (token.status) {
      case 'called':
        return (
          <div className="bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-2xl animate-bounce flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
            <Volume2 className="w-5 h-5 animate-pulse" />
            आपकी बारी आ गई है! तुरंत काउंटर पर पधारें
          </div>
        );
      case 'in_progress':
        return (
          <div className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            काउंटर पर कार्य जारी है (In Progress)
          </div>
        );
      case 'completed':
        return (
          <div className="bg-teal-600 text-white font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            कार्य पूर्ण हो चुका है (Completed)
          </div>
        );
      case 'absent':
        return (
          <div className="bg-amber-600 text-white font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2">
            अनुपस्थित / टोकन आगे बढ़ाया गया (Absent)
          </div>
        );
      case 'waiting':
      default:
        return (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold px-4 py-2 rounded-2xl flex items-center justify-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            कतार में प्रतीक्षारत (Waiting in Queue)
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Top back & refresh bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          नया टोकन फॉर्म (New Booking)
        </button>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          लाइव स्थिति रिफ्रेश
        </button>
      </div>

      {/* 10-MINUTE EARLY REMINDER NOTIFICATION BANNER */}
      {is10MinAlertBannerOpen && token.status === 'waiting' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-white animate-pulse flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-orange-600 flex items-center justify-center shrink-0 shadow-md">
              <BellRing className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-100 block">
                ⏰ 10 मिनट पूर्व स्लॉट अलर्ट
              </span>
              <p className="text-base sm:text-lg font-black leading-tight">
                आपकी बारी में 10 मिनट शेष हैं! कृपया काउंटर के समीप पहुंचें।
              </p>
              <p className="text-xs text-amber-100 mt-0.5">
                स्लॉट समय: <strong>{token.slotFullText}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIs10MinAlertBannerOpen(false)}
            className="bg-black/30 hover:bg-black/40 text-white text-xs px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
          >
            बंद करें (Dismiss)
          </button>
        </div>
      )}

      {/* URGENT TURN ARRIVAL ALARM BANNER */}
      {(token.status === 'called' || isAlarmPlaying) && (
        <div className="bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white p-5 rounded-3xl shadow-2xl border-4 border-white animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left no-print">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center shrink-0 shadow-lg">
              <Volume2 className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-100 block">
                🚨 अलार्म & वाइब्रेशन सक्रिय है!
              </span>
              <p className="text-xl sm:text-2xl font-black">
                आपकी बारी आ गई है! तुरंत काउंटर पर जाएं
              </p>
            </div>
          </div>

          <button
            onClick={handleStopAlarm}
            className="bg-slate-950 hover:bg-black text-amber-300 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <VolumeX className="w-4 h-4" />
            अलार्म म्यूट करें
          </button>
        </div>
      )}

      {/* 10-MINUTE PUSH NOTIFICATION & PWA REMINDER CARD */}
      <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-md space-y-3 no-print">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                10 मिनट पूर्व नोटिफिकेशन अलर्ट (Push Reminder)
                {notifStatus === 'granted' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" /> सक्रिय
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                समय स्लॉट ({token.slotFullText}) से ठीक 10 मिनट पहले आपके फोन/ब्राउज़र पर पुश अलर्ट व घंटी बजेगी।
              </p>
            </div>
          </div>
        </div>

        {testNotifMessage && (
          <div className="p-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 animate-fadeIn">
            {testNotifMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          {notifStatus === 'granted' ? (
            <>
              <button
                onClick={handleTestNotification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>🔊 टेस्ट अलर्ट बजाएं (Test Alert)</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium">
                स्लॉट से 10 मिनट पहले बैकग्राउंड सर्विस वर्कर स्वतः अलर्ट भेजेगा
              </span>
            </>
          ) : (
            <button
              onClick={handleEnableNotification}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>🔔 10 मिनट पहले अलर्ट चालू करें (Enable Reminder)</span>
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp Message Action Alert */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <p className="font-extrabold text-sm">WhatsApp पर पर्ची भेजें</p>
            <p className="text-[11px] text-emerald-100 font-mono">+91 {token.mobile} पर एक क्लिक में पर्ची व टाइमर भेजें</p>
          </div>
        </div>

        <button
          onClick={handleDirectWhatsApp}
          className="bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>WhatsApp खोलें</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Disruption Warning */}
      {disruption && (disruption.isPaused || disruption.message) && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{disruption.message}</span>
        </div>
      )}

      {/* LIVE COUNTDOWN TIMER CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          लाइव उलटी गिनती (Live Countdown Timer)
        </div>

        {token.status === 'called' ? (
          <div className="my-3 py-2 text-2xl sm:text-3xl font-black text-emerald-300 animate-pulse">
            🔔 आपकी बारी शुरू हो चुकी है!
          </div>
        ) : timeLeft.isPast ? (
          <div className="my-3 py-2">
            <span className="text-sm font-semibold text-indigo-200 block">निर्धारित स्लॉट समय हो चुका है:</span>
            <span className="text-2xl font-black text-amber-300">कृपया काउंटर 1 के पास तैयार रहें</span>
          </div>
        ) : (
          <div className="my-3">
            <p className="text-xs text-indigo-200 font-medium mb-2">
              आपके 10 मिनट के अपॉइंटमेंट में शेष समय:
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono">
              <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl px-3 py-2 min-w-[64px]">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">घंटे</span>
              </div>
              <span className="text-2xl font-black text-indigo-400">:</span>
              <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl px-3 py-2 min-w-[64px]">
                <span className={`text-2xl sm:text-3xl font-black block ${timeLeft.totalSeconds <= 600 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">मिनट</span>
              </div>
              <span className="text-2xl font-black text-indigo-400">:</span>
              <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl px-3 py-2 min-w-[64px]">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">सेकंड</span>
              </div>
            </div>

            {timeLeft.totalSeconds <= 600 && timeLeft.totalSeconds > 0 && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <BellRing className="w-3.5 h-3.5 text-rose-400" />
                <span>10 मिनट से भी कम समय शेष है - काउंटर के पास पहुंचे</span>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-indigo-800/50 flex items-center justify-between text-xs text-indigo-200">
          <span>कतार में आपसे पहले: <strong>{peopleAhead} लोग</strong></span>
          <span>स्लॉट: <strong>{token.slotFullText}</strong></span>
        </div>
      </div>

      {/* Printable Digital Token Slip Card */}
      <div
        id="printable-slip"
        className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative"
      >
        <div className="bg-slate-900 text-white p-6 text-center relative overflow-hidden">
          {token.isEmergency ? (
            <div className="inline-flex items-center gap-1.5 bg-rose-600 text-white font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider mb-2 shadow-md animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              🚨 इमरजेंसी टोकन • निःशुल्क (वास्तविक कारण सत्यापन)
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              सत्यापित डिजिटल टोकन पर्ची
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-black">{centerName}</h2>
          <p className="text-slate-300 text-xs mt-1">
            बारी आने पर स्वतः अलार्म बजेगा एवं फोन कंपन करेगा
          </p>
        </div>

        {/* Big Token Number & Unique ID */}
        <div className="p-6 bg-gradient-to-b from-indigo-50/50 to-white text-center border-b border-dashed border-slate-200">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
            आपका टोकन नंबर (YOUR TOKEN NUMBER)
          </span>

          <div className="my-2">
            <div className={`text-6xl sm:text-7xl font-black tracking-tight font-mono ${token.isEmergency ? 'text-rose-600' : 'text-indigo-900'}`}>
              {token.tokenDisplay}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-300 px-4 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold shadow-xs">
            <span>ग्राहक ID:</span>
            <span className="tracking-wider">{token.uniqueId}</span>
          </div>

          {token.isEmergency && (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 max-w-sm mx-auto flex items-center justify-center gap-1.5">
              <span>✅ इमरजेंसी सेवा पूर्णतः निःशुल्क (Free - Real Purpose Required)</span>
            </div>
          )}

          <div className="mt-4 max-w-sm mx-auto">{getStatusBadge()}</div>
        </div>

        {/* 10-Minute Time Slot Showcase */}
        <div className="p-6 bg-amber-50/70 border-b border-amber-200/80">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 block">
                आवंटित समय स्लॉट (10 मिनट अंतराल)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-0.5">
                {token.slotFullText}
              </div>
              <p className="text-xs text-amber-800 font-medium mt-1">
                📅 तारीख: <strong>{token.slotDate}</strong> • काउंटर: <strong>{token.counter || '1'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Service Details */}
        <div className="p-6 space-y-3.5 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
              <User className="w-4 h-4 text-indigo-600" />
              <span>ग्राहक का नाम:</span>
            </div>
            <span className="font-bold text-slate-900">{token.name}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>मोबाइल नंबर:</span>
            </div>
            <span className="font-bold text-slate-900 font-mono">+91 {token.mobile}</span>
          </div>

          {token.aadhaar && (
            <div className="flex items-center justify-between py-2 border-b border-slate-100 bg-slate-50/60 px-2 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>आधार नंबर:</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">
                •••• •••• {token.aadhaar.slice(-4)}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>काम का प्रकार:</span>
            </div>
            <span className="font-bold text-slate-900 text-right ml-4">
              {token.serviceLabel}
            </span>
          </div>

          {token.correctionOptions && token.correctionOptions.length > 0 && (
            <div className="flex items-start justify-between py-2 border-b border-slate-100 bg-amber-50/60 px-2 rounded-xl">
              <div className="flex items-center gap-2 text-amber-800 shrink-0 font-bold text-xs">
                <FileEdit className="w-4 h-4 text-amber-600" />
                <span>सुधार विवरण:</span>
              </div>
              <span className="font-bold text-amber-950 text-right text-xs">
                {token.correctionOptions.join(' + ')}
              </span>
            </div>
          )}

          {token.notes && (
            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">टिप्पणी:</span>
              <span className="text-slate-700 text-xs font-medium text-right">{token.notes}</span>
            </div>
          )}
        </div>

        {/* AUTOMATED SMS NOTIFICATION & 30-MINUTE EARLY REMINDER SYSTEM */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-50/90 via-yellow-50 to-amber-50 border-t border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  📲 स्वचालित SMS सूचना प्रणाली (Automated SMS)
                </h4>
                <p className="text-[11px] text-amber-900 font-medium">
                  पुष्टिकरण और 30 मिनट पूर्व रिमाइंडर SMS सेवा
                </p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
              सक्रिय (Active)
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {/* Confirmation SMS Status */}
            <div className="p-2.5 bg-white/90 border border-amber-200 rounded-xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    टोकन पुष्टिकरण SMS भेजा गया (+91 {token.mobile})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    टोकन: <strong>{token.tokenDisplay}</strong> • समय स्लॉट: <strong>{token.slotFullText}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleResendSMS('confirmation')}
                disabled={isSendingSMS}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSendingSMS ? 'भेज रहा है...' : 'पुनः भेजें'}
              </button>
            </div>

            {/* 30-Minute Early Reminder SMS Status */}
            <div className="p-2.5 bg-white/90 border border-amber-200 rounded-xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    ⏰ 30 मिनट पूर्व रिमाइंडर SMS: {token.smsReminder30Sent ? 'भेजा जा चुका है' : 'स्वचालित रूप से सक्रिय'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {token.smsReminder30Sent
                      ? 'आपके नंबर पर 30 मिनट पूर्व का अलर्ट SMS भेजा गया है।'
                      : 'आपके निर्धारित स्लॉट से ठीक 30 मिनट पहले स्वतः SMS प्राप्त होगा।'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleResendSMS('reminder_30min')}
                disabled={isSendingSMS}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSendingSMS ? '...' : 'रिमाइंडर भेजें'}
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {smsFeedback && (
            <div className="p-2 bg-emerald-700 text-white rounded-xl text-xs font-bold text-center animate-in fade-in">
              {smsFeedback}
            </div>
          )}

          {/* One-tap Native SMS Message Link for customer's phone */}
          <div className="pt-1 flex items-center justify-between gap-2 no-print">
            <a
              href={`sms:+91${token.mobile}?body=${getNativeSMSBody()}`}
              className="w-full text-center py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>फोन के SMS ऐप में पर्ची खोलें (Open in SMS App)</span>
            </a>
          </div>
        </div>

        {/* Verification QR Code Section */}
        {qrDataUrl && (
          <div className="p-6 bg-slate-50 text-center border-t border-slate-200">
            <div className="inline-block p-2 bg-white rounded-2xl shadow-xs border border-slate-200">
              <img src={qrDataUrl} alt="Token QR" className="w-24 h-24 mx-auto" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              काउंटर सत्यापन QR कोड • Unique ID: <strong>{token.uniqueId}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons for Mobile Screen */}
      <div className="grid grid-cols-2 gap-3 no-print">
        <button
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Printer className="w-4 h-4" />
          पर्ची प्रिंट करें
        </button>

        <button
          onClick={handleDirectWhatsApp}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Share2 className="w-4 h-4" />
          WhatsApp भेजें
        </button>
      </div>

      {/* Delete / Cancel Token Option as Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print">
        {showConfirmCancel ? (
          <div className="p-2.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-bold text-rose-950">
              क्या आप वाकई टोकन रद्द करना चाहते हैं?
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDeleteToken}
                disabled={isDeleting}
                className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'रद्द हो रहा है...' : '✓ हाँ, हटाएं'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmCancel(false)}
                className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                रद्द
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmCancel(true)}
            className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 font-bold py-3 px-4 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>❌ टोकन हटाएं / रद्द करें (Delete Token)</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-800 font-bold py-3 px-4 rounded-2xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>+ नया टोकन बुक करें (Book Another)</span>
        </button>
      </div>

      {/* Official UIDAI Check Aadhaar Update Status Link on Token Slip */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-300 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs no-print">
        <div className="text-center sm:text-left">
          <p className="font-extrabold text-slate-900">
            🔍 क्या आपने पहले आधार अपडेट कराया था?
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            UIDAI के आधिकारिक पोर्टल पर अपनी एनरोलमेंट ID (EID) से स्थिति चेक करें
          </p>
        </div>
        <a
          href="https://myaadhaar.uidai.gov.in/CheckAadhaarStatus/en"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition shrink-0 cursor-pointer"
        >
          <span>आधार स्टेटस जांचें</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Bell Chime and Vibration Test */}
      <div className="flex items-center justify-center gap-4 text-center no-print">
        <button
          onClick={() => {
            playUrgentAlarm(2);
            triggerVibration();
          }}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Vibrate className="w-3.5 h-3.5 text-indigo-600" />
          अलार्म व वाइब्रेशन टेस्ट करें
        </button>
      </div>
    </div>
  );
};
