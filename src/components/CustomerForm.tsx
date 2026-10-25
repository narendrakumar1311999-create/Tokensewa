import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Fingerprint,
  UserPlus,
  FileEdit,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CreditCard,
  AlertTriangle,
  Calendar,
  Home,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Headphones,
  FileCheck2,
  IndianRupee,
  Zap,
  ArrowLeft,
  ChevronRight,
  Flame,
  FileSpreadsheet,
  Search,
  Trash2,
  BookOpen,
  Hourglass,
  ExternalLink,
  User,
  ArrowRight
} from 'lucide-react';
import { ServiceType, TokenRecord, DisruptionStatus, SlotItem } from '../types';
import { getTodayDateString } from '../utils/time';
import { checkPostOfficeClosed, getNextWorkingDay } from '../utils/holidays';
import { HelpDeskModal } from './HelpDeskModal';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { CustomerTokenLookupModal } from './CustomerTokenLookupModal';
import { SelfBookingGuideModal } from './SelfBookingGuideModal';

interface CustomerFormProps {
  onTokenGenerated: (token: TokenRecord, queueInfo: any) => void;
  centerName?: string;
  nowServing?: string | null;
  waitingCount?: number;
  disruption?: DisruptionStatus;
  initialMode?: 'portal' | 'simple' | 'normal' | 'emergency';
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onTokenGenerated,
  centerName = 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  nowServing,
  waitingCount = 0,
  disruption,
  initialMode,
}) => {
  // Current view mode: 'portal' (2-option selection) | 'simple' (3-field auto slot) | 'normal' (full) | 'emergency' (₹50 extra)
  const [viewMode, setViewMode] = useState<'portal' | 'simple' | 'normal' | 'emergency'>('portal');

  // Help Desk, Guide and Terms Modals
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [service, setService] = useState<ServiceType>('mobile_update');
  const [notes, setNotes] = useState('');

  // Correction sub-options (can check both)
  const [isAddressChange, setIsAddressChange] = useState(false);
  const [isRelationChange, setIsRelationChange] = useState(false);

  // Custom Date and Slot selection state (for normal mode)
  const [isCustomSlotMode, setIsCustomSlotMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = getTodayDateString();
    const closed = checkPostOfficeClosed(today);
    return closed.isClosed ? getNextWorkingDay(today) : today;
  });
  const [selectedSlotMinutes, setSelectedSlotMinutes] = useState<number | null>(null);
  const [slotsList, setSlotsList] = useState<SlotItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [serverLiveTime, setServerLiveTime] = useState<string>('');
  const [closedInfo, setClosedInfo] = useState<{
    isClosed: boolean;
    reason?: string;
    holidayName?: string;
    isSunday?: boolean;
    nextWorkingDate?: string;
  } | null>(() => {
    const today = getTodayDateString();
    const closed = checkPostOfficeClosed(today);
    if (closed.isClosed) {
      return {
        isClosed: true,
        reason: closed.reason,
        holidayName: closed.holidayName,
        isSunday: closed.isSunday,
        nextWorkingDate: getNextWorkingDay(today),
      };
    }
    return null;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick Token & Mobile Number Retrieval (Direct Countdown Screen Opener)
  const [quickLookupQuery, setQuickLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [quickLookupError, setQuickLookupError] = useState('');
  const [multipleTokensFound, setMultipleTokensFound] = useState<TokenRecord[] | null>(null);

  const handleDirectTokenLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickLookupQuery.trim();
    if (!q) return;

    setIsLookingUp(true);
    setQuickLookupError('');
    try {
      const res = await fetch(`/api/tokens/find?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.tokens && data.tokens.length > 1) {
          setMultipleTokensFound(data.tokens);
        } else if (data.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('my_last_token_id', data.token.id);
          }
          onTokenGenerated(data.token, data.queueInfo);
        }
      } else {
        setQuickLookupError(data.error || 'टोकन नहीं मिला। कृपया नंबर जांचें।');
      }
    } catch {
      setQuickLookupError('सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSelectMultipleToken = async (selectedToken: TokenRecord) => {
    try {
      const res = await fetch(`/api/tokens/${selectedToken.id}`);
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('my_last_token_id', data.token.id);
        }
        setMultipleTokensFound(null);
        onTokenGenerated(data.token, data.queueInfo);
      } else {
        onTokenGenerated(selectedToken, null);
      }
    } catch {
      onTokenGenerated(selectedToken, null);
    }
  };

  // Detect query param mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const qrParam = params.get('qr');

      if (modeParam === 'simple' || qrParam === '1' || initialMode === 'simple') {
        setViewMode('simple');
      } else if (modeParam === 'normal' || initialMode === 'normal') {
        setViewMode('normal');
      } else if (modeParam === 'emergency' || initialMode === 'emergency') {
        setViewMode('emergency');
      } else {
        setViewMode('portal');
      }
    }
  }, [initialMode]);

  const services = [
    {
      id: 'mobile_update' as ServiceType,
      num: '1',
      title: 'मोबाइल नंबर अपडेट करवाना है',
      subtext: 'आधार / बैंक में नया मोबाइल नंबर जोड़ना या बदलना',
      icon: Smartphone,
      color: 'blue',
      badge: 'सबसे लोकप्रिय',
    },
    {
      id: 'biometric_update' as ServiceType,
      num: '2',
      title: 'बायोमेट्रिक अपडेट',
      subtext: 'फिंगरप्रिंट, आईरिस (आंख) या फोटो अपडेट करवाना',
      icon: Fingerprint,
      color: 'emerald',
      badge: 'अनिवार्य 5/15 वर्ष',
    },
    {
      id: 'new_enrollment' as ServiceType,
      num: '3',
      title: 'नया इनरोलमेंट बनवाना है',
      subtext: 'बच्चे या नए व्यक्ति का नया आधार कार्ड बनवाना',
      icon: UserPlus,
      color: 'purple',
      badge: 'नया आधार',
    },
    {
      id: 'correction' as ServiceType,
      num: '4',
      title: 'आधार सुधार / करेक्शन (Correction)',
      subtext: 'पता (Address) या पिता / पति (S/O, D/O, W/O) का नाम सुधारें',
      icon: FileEdit,
      color: 'amber',
      badge: 'सुधार',
    },
  ];

  // Auto format Aadhaar with spaces (1234 5678 9012)
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const parts = raw.match(/.{1,4}/g);
    setAadhaar(parts ? parts.join(' ') : raw);
  };

  // Fetch slots whenever custom mode is opened or selectedDate changes
  useEffect(() => {
    if (viewMode === 'normal' && isCustomSlotMode) {
      // First check local holiday/Sunday logic
      const localCheck = checkPostOfficeClosed(selectedDate);
      if (localCheck.isClosed) {
        setClosedInfo({
          isClosed: true,
          reason: localCheck.reason,
          holidayName: localCheck.holidayName,
          isSunday: localCheck.isSunday,
          nextWorkingDate: getNextWorkingDay(selectedDate),
        });
        setSlotsList([]);
        setIsLoadingSlots(false);
        return;
      }

      setIsLoadingSlots(true);
      fetch(`/api/slots?date=${selectedDate}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.isClosed) {
              setClosedInfo({
                isClosed: true,
                reason: data.closedReason,
                holidayName: data.holidayName,
                isSunday: data.isSunday,
                nextWorkingDate: data.nextWorkingDate,
              });
              setSlotsList([]);
            } else {
              setClosedInfo(null);
              setSlotsList(data.slots || []);
            }
            if (data.currentLiveTime) {
              setServerLiveTime(data.currentLiveTime);
            }
          }
        })
        .catch((err) => console.error('Failed to load slots:', err))
        .finally(() => setIsLoadingSlots(false));
    }
  }, [viewMode, isCustomSlotMode, selectedDate]);

  // Handle Submit for all modes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('कृपया अपना पूरा नाम लिखें। (Please enter your name)');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMessage('कृपया सही 10 अंकों का मोबाइल नंबर भरें। (Please enter valid 10-digit mobile)');
      return;
    }

    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      setErrorMessage('आधार नंबर अनिवार्य है! कृपया सही 12 अंकों का आधार नंबर दर्ज करें। (1 आधार नंबर = केवल 1 टोकन)');
      return;
    }

    // Check Sunday or Post Office Holiday on booking date
    const targetDate = (viewMode === 'normal' && isCustomSlotMode) ? selectedDate : getTodayDateString();
    const closedCheck = checkPostOfficeClosed(targetDate);
    if (closedCheck.isClosed) {
      const nextDay = getNextWorkingDay(targetDate);
      setErrorMessage(`${closedCheck.reason} - इस दिन केंद्र बंद रहता है। कृपया कार्यदिवस (${nextDay}) के लिए टोकन बुक करें।`);
      return;
    }

    // Prepare correction options if correction service is selected in normal mode
    const correctionOptions: string[] = [];
    if (viewMode === 'normal' && service === 'correction') {
      if (!isAddressChange && !isRelationChange) {
        setErrorMessage('कृपया सुधार के प्रकार में से कम से कम एक विकल्प (Address Change या S/O D/O W/O) चुनें।');
        return;
      }
      if (isAddressChange) correctionOptions.push('Address Change (पता सुधार)');
      if (isRelationChange) correctionOptions.push('S/O, D/O, W/O (अभिभावक सुधार)');
    }

    // STRICT CHECK: Disallow selecting a past slot in custom slot mode
    if (viewMode === 'normal' && isCustomSlotMode && selectedSlotMinutes !== null) {
      const selectedSlot = slotsList.find((s) => s.slotMinutes === selectedSlotMinutes);
      if (selectedSlot && (selectedSlot.isPast || !selectedSlot.isAvailable)) {
        setErrorMessage('चयनित समय बीत चुका है या उपलब्ध नहीं है। कृपया वर्तमान या आगामी लाइव स्लॉट चुनें।');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const isEmergency = viewMode === 'emergency';
      const payload: any = {
        name: name.trim(),
        mobile: cleanMobile,
        aadhaar: cleanAadhaar,
        service,
        notes: notes.trim(),
        isEmergency,
        bookingMode: viewMode,
      };

      if (viewMode === 'normal') {
        payload.correctionOptions = correctionOptions.length > 0 ? correctionOptions : undefined;
        payload.preferredDate = isCustomSlotMode ? selectedDate : undefined;
        payload.preferredSlotMinutes = isCustomSlotMode && selectedSlotMinutes !== null ? selectedSlotMinutes : undefined;
      }

      const authToken = typeof window !== 'undefined' ? localStorage.getItem('token_user_auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'टोकन जनरेट करने में विफलता।');
      }

      if (typeof window !== 'undefined' && data.token?.id) {
        localStorage.setItem('my_last_token_id', data.token.id);
      }

      onTokenGenerated(data.token, data.queueInfo);
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMessage(err.message || 'सर्वर से कनेक्ट करने में समस्या हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      {/* Disruption Alert if Server Error */}
      {disruption && (disruption.isPaused || disruption.message) && (
        <div className="bg-rose-600 text-white p-4 rounded-3xl shadow-lg border-2 border-rose-400 flex items-start gap-3 animate-in fade-in">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-black uppercase tracking-wider block text-rose-100">
              ⚠️ UIDAI सर्वर एरर / सिस्टम सूचना
            </span>
            <p className="font-extrabold text-sm text-white mt-0.5">
              {disruption.message}
            </p>
            {disruption.resumesAt && (
              <p className="text-xs font-bold text-rose-100 mt-1">
                सेवा पुनः शुरू होने का अनुमानित समय: <strong>{disruption.resumesAt}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Small Light Yellow Top Header Banner */}
      <div className="bg-amber-50/95 border border-amber-300 text-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1 bg-amber-200/80 border border-amber-300 px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-amber-950">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>डिजिटल टोकन व अपॉइंटमेंट प्रणाली</span>
          </div>

          {viewMode !== 'portal' && (
            <button
              type="button"
              onClick={() => setViewMode('portal')}
              className="text-[11px] font-bold text-amber-900 hover:text-black flex items-center gap-1 bg-white/80 hover:bg-white px-2 py-0.5 rounded-lg border border-amber-300 transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              मुख्य मेनू
            </button>
          )}
        </div>

        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)
        </h1>

        <div className="text-xs text-amber-950 font-semibold mt-1 flex items-center flex-wrap gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>समय: <strong>सुबह 10:00 बजे से शाम 4:00 बजे</strong> (10 मिनट स्लॉट)</span>
        </div>

        {/* Real-time Queue Mini Indicator - Compact */}
        <div className="mt-2.5 pt-2 border-t border-amber-200 grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-amber-200 flex items-center justify-between">
            <span className="text-slate-600">काउंटर पर:</span>
            <span className="font-extrabold text-emerald-700">
              {nowServing || 'तैयार (Ready)'}
            </span>
          </div>
          <div className="bg-white/80 rounded-xl px-2.5 py-1.5 border border-amber-200 flex items-center justify-between">
            <span className="text-slate-600">कतार में:</span>
            <span className="font-extrabold text-amber-800">
              {waitingCount} लोग प्रतीक्षारत
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: PORTAL (Landing Page with 2 Options + Open My Token + Help Desk + Bottom Light Purple Guide) */}
      {viewMode === 'portal' && (
        <div className="space-y-3.5 animate-in fade-in">
          {/* Top Quick Actions: Simple 1-Click Booking and Search/Delete Token */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2 sm:p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-950 truncate">
                  1-क्लिक सीधा टोकन
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('simple')}
                className="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs shrink-0"
              >
                सरल &rarr;
              </button>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-2 sm:p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-rose-950 truncate">
                  टोकन खोजें / हटाएं
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLookupOpen(true)}
                className="text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs shrink-0"
              >
                खोजें
              </button>
            </div>
          </div>

          {/* TWO MAIN OPTIONS - COMPACT & PROFESSIONAL */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="text-center space-y-0.5 pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                अपॉइंटमेंट का प्रकार चुनें
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                आप किस प्रकार टोकन लेना चाहते हैं?
              </h2>
              <p className="text-[11px] text-slate-500">
                अपनी सुविधा अनुसार सामान्य या तत्काल इमरजेंसी अपॉइंटमेंट चुनें
              </p>
            </div>

            <div className="space-y-2.5">
              {/* OPTION 1: Normal Appointment Book */}
              <button
                type="button"
                onClick={() => setViewMode('normal')}
                className="w-full text-left p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/70 to-white hover:from-indigo-100/70 hover:to-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-xl transition-all shadow-xs group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-900">
                          सामान्य अपॉइंटमेंट बुक करें
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-indigo-100 text-indigo-800 uppercase">
                          Normal
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        अपनी पसंद का समय व तारीख चुनें, आधार नंबर एवं सुधार के सभी विकल्पों के साथ।
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-indigo-700">
                        <span>• समय स्लॉट चयन</span>
                        <span>• 100% निःशुल्क</span>
                        <span>• क्रमबद्ध सेवा</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </button>

              {/* OPTION 2: Emergency Appointment Book (100% Free - Real Purpose Required) */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode('emergency')}
                  className="w-full text-left p-3.5 sm:p-4 bg-gradient-to-r from-rose-50/70 via-amber-50/20 to-white hover:from-rose-100/80 hover:to-amber-50 border border-rose-200 hover:border-rose-400 rounded-xl transition-all shadow-xs group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform animate-pulse">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-rose-900">
                            इमरजेंसी अपॉइंटमेंट बुक करें
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-rose-600 text-white uppercase shadow-xs">
                            VIP Priority
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                          अति आवश्यक कार्य हेतु तुरंत प्राथमिकता। कतार में लगे बिना तत्काल सेवा प्राप्त करें।
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </button>

                {/* 100% Free Emergency Service notice with Real Purpose requirement */}
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-950 font-bold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>इमरजेंसी सेवा: <strong>पूर्णतः निःशुल्क (100% Free)</strong></span>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                    वास्तविक कारण आवश्यक
                  </span>
                </div>
              </div>
            </div>

            {/* DIRECTLY BELOW BOOKING APPOINTMENT: COMPACT OPEN MY TOKEN CARD */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-300 rounded-xl p-2.5 sm:p-3 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Hourglass className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                    ⚡ पहले से टोकन ले चुके हैं? (Open My Token)
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    टोकन नंबर या मोबाइल नंबर भरें और तुरंत लाइव टाइमर (Countdown) खोलें
                  </h3>
                  <p className="text-[10px] text-slate-600 font-medium">
                    यदि स्क्रीन बंद हो गई थी या टोकन भूल गए हैं, तो यहाँ से तुरंत अपनी लाइव पर्ची देखें
                  </p>
                </div>
              </div>

              <form onSubmit={handleDirectTokenLookup} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    value={quickLookupQuery}
                    onChange={(e) => {
                      setQuickLookupQuery(e.target.value);
                      setQuickLookupError('');
                    }}
                    placeholder="टोकन नंबर (उदा. TK-05 या 5) या 10-अंकों का मोबाइल नंबर..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white text-slate-900 border border-amber-300 rounded-lg text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp || !quickLookupQuery.trim()}
                  className="py-1.5 px-3.5 bg-slate-900 hover:bg-black text-amber-300 disabled:opacity-50 font-black text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isLookingUp ? (
                    <span>खोज रहा है...</span>
                  ) : (
                    <>
                      <Hourglass className="w-3.5 h-3.5" />
                      <span>लाइव टाइमर खोलें</span>
                    </>
                  )}
                </button>
              </form>

              {quickLookupError && (
                <div className="p-1.5 bg-rose-600 text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{quickLookupError}</span>
                </div>
              )}
            </div>

            {/* HELP DESK SECTION - COMPACT */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11.5px] font-black text-slate-900 uppercase tracking-wider">
                      हेल्प डेस्क एवं सहायता (Help Desk Support)
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      सामान्य समस्याओं के समाधान, आवश्यक दस्तावेज व संपर्क
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpDeskOpen(true)}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  पूरा हेल्प डेस्क &rarr;
                </button>
              </div>

              {/* Quick Contact & Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                <a
                  href="tel:1947"
                  className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-left transition flex items-center gap-2 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 truncate">1947 (टोल-फ्री)</span>
                    <span className="block text-[9.5px] text-slate-500 truncate">UIDAI हेल्पलाइन</span>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => setIsHelpDeskOpen(true)}
                  className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 truncate">दस्तावेज लिस्ट</span>
                    <span className="block text-[9.5px] text-slate-500 truncate">जरूरी कागजात जांचें</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="col-span-2 sm:col-span-1 p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 truncate">नियम व शर्तें</span>
                    <span className="block text-[9.5px] text-slate-500 truncate">T&C दिशानिर्देश</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* USER BOOKING GUIDE BANNER - POSITIONED AT THE VERY BOTTOM IN LIGHT PURPLE AS REQUESTED */}
          <div className="bg-purple-50/90 border border-purple-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-200/80 text-purple-800 flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                  📖 यूज़र गाइड एवं दिशानिर्देश (Booking Guide)
                </span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  खुद से अपॉइंटमेंट कैसे बुक करें?
                </h3>
                <p className="text-[10.5px] text-purple-900/80 font-medium mt-0.5">
                  4 सरल चरणों में टोकन प्राप्त करें, लाइव उलटी गिनती देखें व बिना कतार के काम कराएं।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="py-1.5 px-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>गाइड व नियम पढ़ें</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dedicated Admin App Link for Operators */}
          <div className="pt-1 text-center">
            <a
              href="?app=admin"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>🔐 केवल ऑपरेटर व एडमिन हेतु (Open Admin App)</span>
            </a>
          </div>
        </div>
      )}

      {/* VIEW 2: SIMPLE DIRECT APPOINTMENT (QR 1 - Only Name, Mobile, Kya Kaam Karna Hai & Auto Date-Time) */}
      {viewMode === 'simple' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 mb-0.5">
                <Zap className="w-3 h-3" />
                QR 1: त्वरित सरल अपॉइंटमेंट
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                1-क्लिक सीधा टोकन
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('portal')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              अन्य विकल्प &rarr;
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Automatic Date & Time allocation banner */}
          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-950 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              तारीख और समय स्वतः (Automatic) मिलेगा। टोकन जनरेट होते ही तुरंत काउंटर समय आवंटित हो जाएगा।
            </span>
          </div>

          <div className="space-y-3">
            {/* 1. Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                1. पूरा नाम (Full Name) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. राहुल कुमार शर्मा"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 2. Mobile */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                2. मोबाइल नंबर (WhatsApp Number) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                टोकन पर्ची व SMS पुष्टिकरण इस नंबर पर भेजा जाएगा।
              </p>
            </div>

            {/* 3. Aadhaar Number (Mandatory) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  3. 12 अंकों का आधार नंबर (Aadhaar) *
                </label>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  अनिवार्य (1 आधार = 1 टोकन)
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={14}
                value={aadhaar}
                onChange={handleAadhaarChange}
                placeholder="1234 5678 9012"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                नियम: एक आधार कार्ड से एक समय में केवल एक सक्रिय टोकन मान्य है।
              </p>
            </div>

            {/* 4. Kya Kaam Karna Hai */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. क्या काम करवाना है? (Select Service) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setService(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      service === s.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        service === s.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{s.title}</p>
                      <p className="text-[9.5px] text-slate-500 truncate">{s.badge}</p>
                    </div>
                    {service === s.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>टोकन जनरेट हो रहा है...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ तुरंत अपॉइंटमेंट बुक करें (Generate Token Now)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* VIEW 3: EMERGENCY APPOINTMENT FORM (100% Free - Real Purpose Required) */}
      {viewMode === 'emergency' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/90 shadow-xs space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-rose-100">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-600 text-white mb-0.5 shadow-xs">
                <Flame className="w-3 h-3" />
                इमरजेंसी / तत्काल सेवा (Priority VIP Queue)
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                इमरजेंसी अपॉइंटमेंट फॉर्म
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('portal')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              ← वापस
            </button>
          </div>

          {/* 100% Free Emergency Banner with Real Purpose Requirement */}
          <div className="p-2.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-rose-50 border border-emerald-300 rounded-xl space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>इमरजेंसी सेवा: पूर्णतः निःशुल्क (100% Free Service)</span>
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              नोट: इमरजेंसी अपॉइंटमेंट के लिए कोई शुल्क नहीं है (₹0)। यह केवल वास्तविक आपातकालीन कारणों (जैसे मेडिकल, तत्काल यात्रा, भर्ती परीक्षा) के लिए उपलब्ध है।
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                पूरा नाम (Customer Name) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. अमित कुमार"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                मोबाइल नंबर (WhatsApp Alert) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            {/* Mandatory Aadhaar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                  आधार कार्ड नंबर (Aadhaar Number) *
                </label>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  अनिवार्य (1 आधार = 1 टोकन)
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={14}
                value={aadhaar}
                onChange={handleAadhaarChange}
                placeholder="1234 5678 9012"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono tracking-wider"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                सुरक्षा नियम: एक आधार कार्ड से एक समय में केवल 1 सक्रिय टोकन बुक किया जा सकता है।
              </p>
            </div>

            {/* Service */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                इमरजेंसी कार्य का प्रकार चुनें *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setService(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      service === s.id
                        ? 'border-rose-600 bg-rose-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        service === s.id ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{s.title}</p>
                      <p className="text-[9.5px] text-slate-500 truncate">{s.badge}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Notes / Real Purpose */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                इमरजेंसी का वास्तविक कारण (Real Emergency Purpose) *
              </label>
              <input
                type="text"
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. तत्काल ट्रेन/फ्लाइट यात्रा, मेडिकल इमरजेंसी, या भर्ती/परीक्षा अंतिम तिथि"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                इमरजेंसी सेवा पूर्णतः निःशुल्क (100% Free) है, परन्तु कारण वास्तविक होना आवश्यक है।
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>इमरजेंसी टोकन जारी हो रहा है...</span>
            ) : (
              <>
                <Flame className="w-4 h-4 fill-current" />
                <span>🚨 इमरजेंसी टोकन लें (निःशुल्क - Real Purpose)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* VIEW 4: NORMAL ADVANCED APPOINTMENT FORM (Full slot picker, correction options, etc.) */}
      {viewMode === 'normal' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-100 text-indigo-800 mb-0.5">
                <Calendar className="w-3 h-3" />
                सामान्य अपॉइंटमेंट (Standard Booking)
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                विस्तृत अपॉइंटमेंट बुकिंग
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('portal')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              ← वापस
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                पूरा नाम (Full Name) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. राहुल कुमार शर्मा"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                मोबाइल नंबर (10-Digit Mobile) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Mandatory Aadhaar Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  आधार कार्ड नंबर (12 अंक) *
                </label>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  अनिवार्य (1 आधार = 1 टोकन)
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={14}
                value={aadhaar}
                onChange={handleAadhaarChange}
                placeholder="1234 5678 9012"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                सुरक्षा नियम: एक आधार कार्ड नंबर पर केवल एक सक्रिय टोकन की अनुमति है।
              </p>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                सेवा का चयन करें (Choose Service) *
              </label>
              <div className="space-y-2">
                {services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setService(s.id)}
                    className={`p-2.5 rounded-xl border-2 transition cursor-pointer flex items-center gap-3 ${
                      service === s.id
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        service === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">{s.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{s.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Correction Sub-options if correction service is selected */}
            {service === 'correction' && (
              <div className="p-3 bg-amber-50/70 border-2 border-amber-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <FileEdit className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">
                    सुधार के प्रकार का चयन करें (कम से कम 1 या दोनों चुनें):
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {/* Option 1: Address Change */}
                  <label
                    className={`p-2 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition ${
                      isAddressChange
                        ? 'border-amber-600 bg-amber-100/70 text-amber-950 font-bold'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAddressChange}
                      onChange={(e) => setIsAddressChange(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-extrabold">
                      <Home className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Address Change (पता सुधार)</span>
                    </div>
                  </label>

                  {/* Option 2: Relation Change (S/O D/O W/O) */}
                  <label
                    className={`p-2 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition ${
                      isRelationChange
                        ? 'border-amber-600 bg-amber-100/70 text-amber-950 font-bold'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isRelationChange}
                      onChange={(e) => setIsRelationChange(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-extrabold">
                      <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>S/O, D/O, W/O (पिता/पति सुधार)</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Interactive Custom Date and Slot Selector */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    तारीख एवं समय अपनी पसंद से चुनें?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomSlotMode(!isCustomSlotMode)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  {isCustomSlotMode ? 'स्वतः समय पर लौटें' : 'समय खुद चुनें'}
                </button>
              </div>

              {isCustomSlotMode ? (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      तारीख चुनें (Select Date):
                    </label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlotMinutes(null);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  {isLoadingSlots ? (
                    <div className="py-3 text-center text-xs text-slate-500">
                      स्लॉट उपलब्धता लोड हो रही है...
                    </div>
                  ) : closedInfo && closedInfo.isClosed ? (
                    <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 text-center animate-in fade-in">
                      <div className="flex items-center justify-center gap-2 text-rose-900 font-black text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{closedInfo.reason || 'रविवार / डाकघर अवकाश: केंद्र बंद है'}</span>
                      </div>
                      <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                        रविवार साप्ताहिक अवकाश एवं सरकारी डाकघर अवकाश के दिन आधार केंद्र बंद रहता है, जिस कारण इस दिन अपॉइंटमेंट स्लॉट बुक नहीं हो सकते।
                      </p>
                      {closedInfo.nextWorkingDate && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(closedInfo.nextWorkingDate!);
                              setSelectedSlotMinutes(null);
                            }}
                            className="py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5 text-amber-300" />
                            <span>👉 अगले कार्यदिवस ({closedInfo.nextWorkingDate}) के खुले स्लॉट देखें</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {serverLiveTime && (
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5 px-2 py-1 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                          <span className="flex items-center gap-1.5 text-indigo-950">
                            <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                            लाइव समय: <strong className="font-mono text-indigo-700">{serverLiveTime}</strong>
                          </span>
                          <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                            बीते समय की बुकिंग प्रतिबंधित है
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 font-medium mb-1.5">
                        हरे रंग का समय खाली है, लाल रंग का स्लॉट फुल है, ग्रे रंग का स्लॉट बीत चुका है:
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-0.5">
                        {slotsList.map((slot) => {
                          const isSelected = selectedSlotMinutes === slot.slotMinutes;
                          return (
                            <button
                              key={slot.slotMinutes}
                              type="button"
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedSlotMinutes(slot.slotMinutes)}
                              className={`p-1.5 rounded-lg text-[11px] font-bold border transition text-center ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                  : slot.isBooked
                                  ? 'bg-rose-50 border-rose-200 text-rose-800 cursor-not-allowed opacity-80'
                                  : slot.isPast
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                                  : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50 cursor-pointer'
                              }`}
                            >
                              <span>{slot.slotStartTime}</span>
                              {slot.isBooked && <span className="block text-[8px] text-rose-600">फुल (Full)</span>}
                              {slot.isPast && <span className="block text-[8px] text-slate-400">समय बीत चुका</span>}
                              {slot.isAvailable && !isSelected && <span className="block text-[8px] text-emerald-600">उपलब्ध</span>}
                              {isSelected && <span className="block text-[8px] text-indigo-100">चयनित</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  डिफ़ॉल्ट रूप से आपको कतार के अनुसार तुरंत अगला 10-मिनट का स्लॉट स्वतः आवंटित किया जाएगा।
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>अपॉइंटमेंट दर्ज हो रहा है...</span>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>📅 सामान्य अपॉइंटमेंट बुक करें (Book Token)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Official UIDAI Check Aadhaar Update Status Link */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-300 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
            <span>🔍 आधिकारिक UIDAI स्टेटस ट्रैकर</span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900">
            आधार अपडेट स्थिति जांचें (Check Aadhaar Status)
          </h4>
          <p className="text-[11px] text-slate-600">
            क्या आपने पहले आधार अपडेट कराया था? अपने Enrolment ID (EID) या SRN से लाइव स्थिति चेक करें।
          </p>
        </div>
        <a
          href="https://myaadhaar.uidai.gov.in/CheckAadhaarStatus/en"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:from-emerald-800 active:to-teal-900 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs hover:shadow-sm transition shrink-0 cursor-pointer"
        >
          <span>आधार स्टेटस जांचें (Check Status)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Self Booking Guide Modal */}
      <SelfBookingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartBooking={(mode) => setViewMode(mode)}
      />

      {/* Help Desk Modal */}
      <HelpDeskModal
        isOpen={isHelpDeskOpen}
        onClose={() => setIsHelpDeskOpen(false)}
        centerName={centerName}
      />

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Customer Token Lookup and Delete Modal */}
      <CustomerTokenLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelectToken={(token) => onTokenGenerated(token, null)}
      />

      {/* Multiple Tokens Selection Modal */}
      {multipleTokensFound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  आपके नंबर से {multipleTokensFound.length} टोकन मिले हैं
                </h4>
                <p className="text-xs text-slate-500">
                  जिस टोकन का लाइव टाइमर देखना चाहते हैं, उस पर क्लिक करें:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMultipleTokensFound(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {multipleTokensFound.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectMultipleToken(t)}
                  className="w-full text-left p-3 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-slate-50 hover:bg-indigo-50/60 transition flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-12 h-10 rounded-xl font-mono font-black text-sm text-white flex items-center justify-center shrink-0 ${t.isEmergency ? 'bg-rose-600' : 'bg-indigo-900'}`}>
                      {t.tokenDisplay}
                    </span>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">{t.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{t.slotFullText}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-xs">
                    खोलें &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
