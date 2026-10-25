import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  CalendarClock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Server
} from 'lucide-react';
import { DisruptionStatus } from '../types';

interface DisruptionControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  disruption?: DisruptionStatus;
  authToken: string;
  onRefresh: () => void;
}

export const DisruptionControlModal: React.FC<DisruptionControlModalProps> = ({
  isOpen,
  onClose,
  disruption,
  authToken,
  onRefresh,
}) => {
  const [customMinutes, setCustomMinutes] = useState('15');
  const [delayReason, setDelayReason] = useState('सर्वर एरर');
  const [customPauseMsg, setCustomPauseMsg] = useState('');
  const [resumeMins, setResumeMins] = useState(30);
  const [showConfirmShift, setShowConfirmShift] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // 1. Delay Waiting Tokens by N Minutes
  const handleDelayTokens = async (minutes: number, reason: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/queue/delay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ minutes, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'टोकन समय बढ़ाने में विफल');
      }
      setMessage({ type: 'success', text: data.message });
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'त्रुटि हुई' });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Pause / Resume Queue
  const handleTogglePause = async (isPaused: boolean) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/queue/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          isPaused,
          reasonType: 'server_error',
          message: customPauseMsg.trim() || 'UIDAI सर्वर डाउन / तकनीकी रुकावट के कारण कतार अस्थाई रूप से रोकी गई है।',
          resumeMinutes: resumeMins,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'स्थिति बदलने में विफल');
      }
      setMessage({
        type: 'success',
        text: isPaused ? 'सर्वर एरर के कारण कतार अस्थाई रूप से रोक दी गई है।' : 'कतार पुनः प्रारंभ कर दी गई है।',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'त्रुटि हुई' });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Shift Remaining Tokens to Next Working Day
  const handleShiftNextDay = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/queue/shift-next-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'कल के लिए शिफ्ट करने में विफल');
      }
      setMessage({ type: 'success', text: data.message });
      setShowConfirmShift(false);
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'त्रुटि हुई' });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Clear Disruption / Notification completely
  const handleClearDisruption = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/queue/clear-disruption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'सूचना हटाने में विफल');
      }
      setMessage({ type: 'success', text: 'सर्वर एरर व रुकावट सूचना हटा दी गई।' });
      onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'त्रुटि हुई' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              सर्वर एरर एवं टाइम कंट्रोल
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              सर्वर एरर या तकनीकी रुकावट होने पर टोकन समय स्वतः बदलें या कल के लिए शिफ्ट करें।
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-5 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {disruption?.message && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="min-w-0">
                <span className="font-extrabold text-amber-950 block">सक्रिय सूचना (Active Alert):</span>
                <span className="text-amber-900 truncate block">{disruption.message}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleClearDisruption}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shrink-0 transition cursor-pointer shadow-xs"
            >
              सूचना हटाएं
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* SECTION 1: Automatic Time Delay (Server Error) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
              <Clock className="w-4 h-4 text-indigo-600" />
              1. सभी प्रतीक्षारत टोकन का समय स्वतः आगे बढ़ाएं (सर्वर एरर)
            </div>
            <p className="text-xs text-slate-500">
              UIDAI सर्वर एरर या तकनीकी रुकावट पर 1 क्लिक में सभी कतारबद्ध ग्राहकों का समय आगे बढ़ाएं:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDelayTokens(15, 'सर्वर स्लो (15 मिनट देरी)')}
                className="py-2.5 px-3 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer text-center"
              >
                + 15 मिनट (सर्वर स्लो)
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDelayTokens(30, 'सर्वर एरर (30 मिनट देरी)')}
                className="py-2.5 px-3 bg-white hover:bg-amber-50 border border-slate-300 hover:border-amber-300 rounded-xl text-xs font-bold text-amber-900 transition cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                + 30 मिनट (सर्वर एरर)
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDelayTokens(45, 'सर्वर डाउन (45 मिनट देरी)')}
                className="py-2.5 px-3 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-bold text-rose-900 transition cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                + 45 मिनट (सर्वर डाउन)
              </button>
            </div>

            {/* Custom Minutes */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="मिनट"
                className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-center"
              />
              <span className="text-xs text-slate-500">कस्टम मिनट:</span>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDelayTokens(parseInt(customMinutes, 10) || 15, delayReason || 'सर्वर एरर')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                लागू करें
              </button>
            </div>
          </div>

          {/* SECTION 2: Pause / Stop Counter with Server Error Notice */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                <Pause className="w-4 h-4 text-rose-600" />
                2. सर्वर एरर पर कतार कुछ समय के लिए रोकें (Server Error Pause)
              </div>
              {disruption?.isPaused && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full uppercase">
                  कतार रुकी हुई है
                </span>
              )}
            </div>

            {disruption?.isPaused ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  कतार अभी रुकी हुई है: <strong>{disruption.message}</strong>
                </p>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleTogglePause(false)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  सर्वर ठीक हुआ - सेवाएं पुनः चालू करें (Resume Queue)
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>UIDAI सर्वर डाउन या पोर्टल एरर होने पर कतार अस्थाई रोकें। ग्राहकों के स्क्रीन पर सर्वर एरर का अलर्ट दिखेगा।</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 font-semibold shrink-0">अनुमानित रुकावट:</label>
                  <select
                    value={resumeMins}
                    onChange={(e) => setResumeMins(parseInt(e.target.value, 10))}
                    className="bg-white border border-slate-300 rounded-xl text-xs py-1.5 px-2.5 font-bold"
                  >
                    <option value={15}>15 मिनट</option>
                    <option value={30}>30 मिनट</option>
                    <option value={45}>45 मिनट</option>
                    <option value={60}>1 घंटा</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleTogglePause(true)}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Pause className="w-4 h-4" />
                  ⚠️ सर्वर एरर: कतार रोकें एवं ग्राहकों को सूचना दें
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: Shift Remaining Tokens to Next Working Day */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-950">
              <CalendarClock className="w-4 h-4 text-indigo-700" />
              3. आज के सभी शेष टोकन कल (Next Day) शिफ्ट करें
            </div>
            <p className="text-xs text-indigo-900/80">
              यदि बड़ा सर्वर डाउन है या काम नहीं हो पा रहा है, तो आज के सभी प्रतीक्षारत ग्राहकों का स्लॉट स्वतः कल सुबह 9:00 बजे से आगे स्थानांतरित हो जाएगा।
            </p>

            {showConfirmShift ? (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2 text-xs font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    क्या आप निश्चित हैं? आज के सभी प्रतीक्षारत व शेष टोकन स्वतः कल सुबह 9:00 AM से आगे स्थानांतरित हो जाएंगे।
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleShiftNextDay}
                    className="flex-1 py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? 'स्थानांतरित हो रहा है...' : '✓ हाँ, कल शिफ्ट करें (Confirm)'}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowConfirmShift(false)}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    रद्द करें
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowConfirmShift(true)}
                className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <CalendarClock className="w-4 h-4" />
                सभी टोकन अगले दिन के लिए शिफ्ट करें (Shift to Tomorrow)
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
