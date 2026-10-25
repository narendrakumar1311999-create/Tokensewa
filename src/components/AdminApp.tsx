import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Crown,
  Briefcase,
  Users,
  Clock,
  Phone,
  MessageSquare,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Settings,
  RefreshCw,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Send,
  Trash2,
  Search,
  Filter,
  Flame,
  Calendar,
  Tv,
  QrCode,
  ArrowLeft,
  ChevronRight,
  Headphones,
  Lock,
  Smartphone,
  Eye
} from 'lucide-react';
import { TokenRecord, AppSettings, QueueMeta, TokenStatus, StaffUser, SMSLogEntry } from '../types';
import { announceToken, playChime } from '../utils/audio';
import { DataSheetTable } from './DataSheetTable';
import { ManualEntryModal } from './ManualEntryModal';
import { SettingsModal } from './SettingsModal';
import { StaffManagementModal } from './StaffManagementModal';
import { DisruptionControlModal } from './DisruptionControlModal';
import { getTodayDateString } from '../utils/time';

interface AdminAppProps {
  tokens: TokenRecord[];
  meta: QueueMeta;
  settings: AppSettings;
  currentUser: StaffUser | null;
  authToken: string;
  onLoginSuccess: (user: StaffUser, token: string) => void;
  onLogout: () => void;
  onUpdateStatus: (id: string, status: TokenStatus, counter?: number) => void;
  onDeleteToken: (id: string) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onResetTokens: () => void;
  onRefresh: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
  onSwitchToCustomer: () => void;
  onOpenTvMode: () => void;
  onOpenPosterMode: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({
  tokens,
  meta,
  settings,
  currentUser,
  authToken,
  onLoginSuccess,
  onLogout,
  onUpdateStatus,
  onDeleteToken,
  onSaveSettings,
  onResetTokens,
  onRefresh,
  selectedDate,
  onDateChange,
  isLoading,
  onSwitchToCustomer,
  onOpenTvMode,
  onOpenPosterMode,
}) => {
  // Navigation inside Admin App
  const [activeAdminTab, setActiveAdminTab] = useState<
    'calling' | 'datasheet' | 'sms_center' | 'settings' | 'links'
  >('calling');

  // Active operator counter selection
  const [activeCounter, setActiveCounter] = useState<number>(1);

  // Modals inside Admin App
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState(false);

  // Login states for operator login gate
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Copy link feedback
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // SMS Logs & Broadcast states
  const [smsLogs, setSmsLogs] = useState<SMSLogEntry[]>([]);
  const [isLoadingSms, setIsLoadingSms] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Load SMS Logs
  const loadSmsLogs = useCallback(async () => {
    setIsLoadingSms(true);
    try {
      const res = await fetch('/api/sms/logs');
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsLogs((data.logs || []).reverse());
      }
    } catch (err) {
      console.warn('Failed to load SMS logs:', err);
    } finally {
      setIsLoadingSms(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && activeAdminTab === 'sms_center') {
      loadSmsLogs();
    }
  }, [currentUser, activeAdminTab, loadSmsLogs]);

  // Handle Quick Login
  const handleQuickLogin = async (pin: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setLoginError(data.error || 'अमान्य पिन (Invalid PIN)');
      }
    } catch {
      setLoginError('लॉगिन विफल। सर्वर से संपर्क नहीं हुआ।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    handleQuickLogin(pinInput.trim());
  };

  // Copy link helper
  const handleCopyLink = (url: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopyFeedback(`✅ ${label} कॉपी हो गया!`);
      setTimeout(() => setCopyFeedback(null), 3500);
    }
  };

  // Token filters for Counter Calling
  const waitingTokens = tokens.filter((t) => t.status === 'waiting');
  const emergencyWaitingTokens = waitingTokens.filter((t) => t.isEmergency);
  const currentToken = tokens.find(
    (t) => (t.status === 'called' || t.status === 'in_progress') && (t.counter === activeCounter || !t.counter)
  );
  const nextToken = waitingTokens[0];

  // Actions for Calling
  const handleCallNext = () => {
    if (nextToken) {
      announceToken(nextToken.tokenDisplay, activeCounter, nextToken.name);
      onUpdateStatus(nextToken.id, 'called', activeCounter);
    } else {
      playChime();
    }
  };

  const handleCallEmergencyNext = (token: TokenRecord) => {
    announceToken(token.tokenDisplay, activeCounter, token.name);
    onUpdateStatus(token.id, 'called', activeCounter);
  };

  const handleRecallCurrent = () => {
    if (currentToken) {
      announceToken(currentToken.tokenDisplay, activeCounter, currentToken.name);
    } else {
      playChime();
    }
  };

  const handleCompleteCurrent = () => {
    if (currentToken) {
      onUpdateStatus(currentToken.id, 'completed', activeCounter);
    }
  };

  const handleSkipCurrent = () => {
    if (currentToken) {
      onUpdateStatus(currentToken.id, 'absent', activeCounter);
    }
  };

  // Resend SMS for a token
  const handleResendTokenSMS = async (tokenId: string, type: 'confirmation' | 'reminder_30min') => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastFeedback('✅ SMS पुनः सफलतापूर्वक भेज दिया गया!');
        loadSmsLogs();
        onRefresh();
      } else {
        setBroadcastFeedback(data.error || 'SMS भेजने में विफलता हुई।');
      }
    } catch {
      setBroadcastFeedback('सर्वर से संपर्क नहीं हो पाया।');
    } finally {
      setTimeout(() => setBroadcastFeedback(null), 4000);
    }
  };

  // Send Broadcast SMS
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    setBroadcastFeedback(null);
    try {
      const res = await fetch('/api/sms/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage.trim(), targetStatus: 'waiting' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastFeedback(`✅ ${data.message}`);
        setBroadcastMessage('');
        loadSmsLogs();
      } else {
        setBroadcastFeedback(data.error || 'ब्रॉडकास्ट विफल रहा।');
      }
    } catch {
      setBroadcastFeedback('सर्वर से संपर्क नहीं हो पाया।');
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setBroadcastFeedback(null), 4000);
    }
  };

  // Current domain links
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const adminAppUrl = `${origin}/?app=admin`;
  const customerPortalUrl = `${origin}/?mode=portal`;
  const quickBookingUrl = `${origin}/?mode=simple`;

  // IF NOT LOGGED IN -> Show Operator Login Gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-slate-800 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Lock className="w-3.5 h-3.5" />
              <span>सुरक्षित ऑपरेटर प्रवेश (Operator Only)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Admin App
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              ऑनलाइन फ्री टोकन सेवा • ऑपरेटर व एडमिन कंट्रोल पैनल
            </p>
          </div>

          {/* Quick PIN Login Buttons for Operators */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              त्वरित 1-क्लिक ऑपरेटर लॉगिन:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('2810')}
                disabled={isLoggingIn}
                className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <span className="font-mono text-[11px] bg-amber-950/20 px-1.5 rounded">2810</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('2811')}
                disabled={isLoggingIn}
                className="p-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Staff 1</span>
                </div>
                <span className="font-mono text-[11px] bg-white/20 px-1.5 rounded">2811</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('2580')}
                disabled={isLoggingIn}
                className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-md transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Staff 2</span>
                </div>
                <span className="font-mono text-[11px] bg-white/20 px-1.5 rounded">2580</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-xs font-bold">या अपना पिन दर्ज करें</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Manual PIN Form */}
          <form onSubmit={handleManualLoginSubmit} className="space-y-3">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError('');
                }}
                placeholder="पिन दर्ज करें (एडमिन: 2810, स्टाफ: 2811 / 2580)..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-900/80 border border-rose-500 text-rose-200 text-xs font-bold rounded-xl text-center animate-in fade-in">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !pinInput.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoggingIn ? 'प्रमाणीकरण हो रहा है...' : 'Admin App में प्रवेश करें'}</span>
            </button>
          </form>

          {/* Switch to customer view link */}
          <div className="pt-2 text-center border-t border-slate-700/60">
            <button
              type="button"
              onClick={onSwitchToCustomer}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ग्राहक बुकिंग पोर्टल पर लौटें (Customer Portal)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN ADMIN APP VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin App Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          {/* Logo & Admin App Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              ADM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Admin App
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {currentUser.role === 'owner' ? '👑 Owner' : '👔 Staff'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {settings.centerName} • ऑपरेटर नियंत्रण कक्ष
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="रिफ्रेश करें"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">रिफ्रेश</span>
            </button>

            {/* Manual Offline Token entry */}
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ऑफलाइन टोकन</span>
            </button>

            {/* TV Display shortcut */}
            <button
              type="button"
              onClick={onOpenTvMode}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              title="टीवी डिस्प्ले खोलें"
            >
              <Tv className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">TV स्क्रीन</span>
            </button>

            {/* Poster shortcut */}
            <button
              type="button"
              onClick={onOpenPosterMode}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              title="2-QR कोड पोस्टर देखें"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">QR पोस्टर</span>
            </button>

            {/* Disruption Control */}
            <button
              type="button"
              onClick={() => setIsDisruptionModalOpen(true)}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="सर्वर रोक व अलर्ट"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline">सर्वर रोक</span>
            </button>

            {/* Switch to customer portal */}
            <button
              type="button"
              onClick={onSwitchToCustomer}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ग्राहक पोर्टल</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="लॉगआउट"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">लॉगआउट</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto py-1 border-t border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveAdminTab('calling')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeAdminTab === 'calling'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>📢 कॉलिंग स्टेशन</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('datasheet')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeAdminTab === 'datasheet'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>📋 लाइव डेटा शीट</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('sms_center')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeAdminTab === 'sms_center'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>📲 SMS सेंटर व लॉग्स</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('links')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeAdminTab === 'links'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-amber-300" />
            <span>🔗 ऐप लिंक व QR हब</span>
          </button>

          {currentUser.role === 'owner' && (
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>⚙️ केंद्र सेटिंग्स</span>
            </button>
          )}

          {currentUser.role === 'owner' && (
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>👥 स्टाफ मैनेजमेंट</span>
            </button>
          )}
        </div>
      </header>

      {/* Copy feedback alert */}
      {copyFeedback && (
        <div className="bg-emerald-600 text-white font-bold text-xs py-2 px-4 text-center shadow-md animate-in fade-in">
          {copyFeedback}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-slate-400 font-medium block">कुल टोकन (आज):</span>
            <span className="text-xl font-black text-white">{meta.todayTotal || tokens.length}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-amber-400 font-medium block">कतार में प्रतीक्षारत:</span>
            <span className="text-xl font-black text-amber-300">{waitingTokens.length}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-emerald-400 font-medium block">काउंटर पर सक्रिय:</span>
            <span className="text-xl font-black text-emerald-300">
              {currentToken ? currentToken.tokenDisplay : 'कोई नहीं'}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-indigo-400 font-medium block">पूर्ण हुए टोकन:</span>
            <span className="text-xl font-black text-indigo-300">
              {tokens.filter((t) => t.status === 'completed').length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-rose-400 font-medium block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> इमरजेंसी VIP:
            </span>
            <span className="text-xl font-black text-rose-300">
              {tokens.filter((t) => t.isEmergency).length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xs">
            <span className="text-sky-400 font-medium block flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> ऑटो SMS प्रेषित:
            </span>
            <span className="text-xl font-black text-sky-300">
              {tokens.filter((t) => t.smsConfirmationSent).length}
            </span>
          </div>
        </div>

        {/* TAB 1: CALLING STATION & COUNTER CONTROLLER */}
        {activeAdminTab === 'calling' && (
          <div className="space-y-4">
            {/* Counter Selection Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">काउंटर चयन करें:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: settings.countersCount || 2 }).map((_, i) => {
                    const cNum = i + 1;
                    return (
                      <button
                        key={cNum}
                        type="button"
                        onClick={() => setActiveCounter(cNum)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                          activeCounter === cNum
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        काउंटर {cNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emergency Alert indicator if any emergency token is waiting */}
              {emergencyWaitingTokens.length > 0 && (
                <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>
                    ध्यान दें: <strong>{emergencyWaitingTokens.length} इमरजेंसी VIP</strong> टोकन कतार में हैं!
                  </span>
                </div>
              )}
            </div>

            {/* Main Serving & Calling Station Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CURRENTLY SERVING CARD */}
              <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    काउंटर {activeCounter} पर वर्तमान सेवा
                  </span>
                  <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                    लाइव स्टेटस
                  </span>
                </div>

                {currentToken ? (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <span className="text-5xl sm:text-6xl font-black font-mono text-amber-300 block">
                        {currentToken.tokenDisplay}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">
                        {currentToken.name}
                      </h3>
                      <p className="text-xs text-indigo-200">
                        {currentToken.serviceLabel} • समय: <strong>{currentToken.slotFullText}</strong>
                      </p>
                      {currentToken.isEmergency && (
                        <span className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white uppercase shadow-sm">
                          🚨 इमरजेंसी VIP टोकन
                        </span>
                      )}
                    </div>

                    {/* Customer contact quick action */}
                    <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">+91 {currentToken.mobile}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:+91${currentToken.mobile}`}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>कॉल</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleResendTokenSMS(currentToken.id, 'confirmation')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>SMS</span>
                        </button>
                      </div>
                    </div>

                    {/* Actions on Current Token */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={handleRecallCurrent}
                        className="py-3 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Volume2 className="w-4 h-4 text-amber-300" />
                        <span>पुनः आवाज दें</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCompleteCurrent}
                        className="py-3 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>सफलतापूर्वक पूर्ण</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipCurrent}
                        className="py-3 px-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl font-bold text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>अनुपस्थित / छोड़ें</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-400">
                      काउंटर {activeCounter} वर्तमान में खाली है
                    </p>
                    <p className="text-xs text-slate-500">
                      कतार से अगला टोकन बुलाने के लिए दाहिने हाथ का बटन दबाएं
                    </p>
                  </div>
                )}
              </div>

              {/* NEXT IN LINE & CALL STATION */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    कतार में अगला टोकन (Next in Queue)
                  </span>
                  <span className="text-xs text-slate-400">
                    कुल शेष: <strong>{waitingTokens.length}</strong>
                  </span>
                </div>

                {nextToken ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/80 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <span className="text-3xl font-black font-mono text-amber-300 block">
                          {nextToken.tokenDisplay}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{nextToken.name}</h4>
                        <p className="text-xs text-slate-400">
                          {nextToken.serviceLabel} • स्लॉट: <strong>{nextToken.slotFullText}</strong>
                        </p>
                      </div>

                      {nextToken.isEmergency && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-600 text-white">
                          VIP
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCallNext}
                      className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 rounded-2xl font-black text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5 text-slate-950" />
                      <span>📢 अगला टोकन बुलाएं ({nextToken.tokenDisplay})</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">
                      सभी टोकन समाप्त हो चुके हैं!
                    </p>
                    <p className="text-xs text-slate-500">
                      वर्तमान में कतार में कोई ग्राहक प्रतीक्षारत नहीं है
                    </p>
                  </div>
                )}

                {/* Emergency VIP Queue if waiting */}
                {emergencyWaitingTokens.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> आपातकालीन VIP टोकन (सीधे बुलाएं):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {emergencyWaitingTokens.map((et) => (
                        <div
                          key={et.id}
                          className="p-2 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-black text-rose-300">{et.tokenDisplay}</span>
                            <span className="text-white ml-2">{et.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCallEmergencyNext(et)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                          >
                            VIP कॉल करें
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE DATA SHEET & TOKEN REGISTER */}
        {activeAdminTab === 'datasheet' && (
          <div className="space-y-4">
            <DataSheetTable
              tokens={tokens}
              onRefresh={onRefresh}
              onUpdateStatus={onUpdateStatus}
              onDeleteToken={onDeleteToken}
              onOpenManualEntry={() => setIsManualModalOpen(true)}
              onOpenDisruptionModal={() => setIsDisruptionModalOpen(true)}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              isLoading={isLoading}
              currentUser={currentUser}
              authToken={authToken}
            />
          </div>
        )}

        {/* TAB 3: SMS CENTER & NOTIFICATION HISTORY */}
        {activeAdminTab === 'sms_center' && (
          <div className="space-y-4">
            {/* Broadcast SMS to Waiting Customers */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      प्रतीक्षारत ग्राहकों को ब्रॉडकास्ट SMS अलर्ट भेजें
                    </h3>
                    <p className="text-xs text-slate-400">
                      वर्तमान में कतार में लगे <strong>{waitingTokens.length}</strong> ग्राहकों को कस्टम सूचना भेजें
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadSmsLogs}
                  disabled={isLoadingSms}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSms ? 'animate-spin' : ''}`} />
                  <span>लॉग्स रीलोड</span>
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-2.5">
                <textarea
                  rows={2}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="उदा. 'सर्वर पुनः शुरू हो गया है, कृपया काउंटर पर आएं।' या 'लंच ब्रेक के बाद सेवा 1:30 बजे शुरू होगी।'..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    * यह SMS आज की तारीख के प्रतीक्षारत सभी टोकन धारकों के फोन पर भेजा जाएगा।
                  </span>

                  <button
                    type="submit"
                    disabled={isBroadcasting || !broadcastMessage.trim() || waitingTokens.length === 0}
                    className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isBroadcasting ? 'भेज रहा है...' : 'ब्रॉडकास्ट भेजें'}</span>
                  </button>
                </div>
              </form>

              {broadcastFeedback && (
                <div className="p-2.5 bg-emerald-900/80 border border-emerald-500 text-emerald-200 text-xs font-bold rounded-xl text-center animate-in fade-in">
                  {broadcastFeedback}
                </div>
              )}
            </div>

            {/* Dispatched SMS Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>स्वचालित SMS प्रेषण इतिहास (Recent Dispatched SMS Logs)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  कुल प्रेषित: {smsLogs.length}
                </span>
              </div>

              {isLoadingSms ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  SMS लॉग्स लोड हो रहे हैं...
                </div>
              ) : smsLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  अभी तक कोई SMS प्रेषण लॉग दर्ज नहीं हुआ है।
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">टोकन</th>
                        <th className="p-2.5">ग्राहक</th>
                        <th className="p-2.5">मोबाइल</th>
                        <th className="p-2.5">प्रकार</th>
                        <th className="p-2.5">संदेश</th>
                        <th className="p-2.5">समय</th>
                        <th className="p-2.5">स्थिति</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {smsLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono font-black text-amber-300">
                            {log.tokenDisplay}
                          </td>
                          <td className="p-2.5 text-white font-medium">
                            {log.recipientName}
                          </td>
                          <td className="p-2.5 font-mono text-slate-300">
                            +91 {log.mobile}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.type === 'confirmation'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : log.type === 'reminder_30min'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              {log.type === 'confirmation'
                                ? 'पुष्टिकरण'
                                : log.type === 'reminder_30min'
                                ? '30m रिमाइंडर'
                                : 'कस्टम'}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300 max-w-xs truncate" title={log.message}>
                            {log.message}
                          </td>
                          <td className="p-2.5 text-slate-400 text-[11px] font-mono">
                            {new Date(log.sentAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> वितरित
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: APP LINKS & QR HUB */}
        {activeAdminTab === 'links' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-white">
                🔗 आधिकारिक ऐप लिंक व QR कोड केंद्र
              </h3>
              <p className="text-xs text-slate-400">
                ऑपरेटर एवं ग्राहकों के लिए सभी आधिकारिक लिंक यहाँ से एक क्लिक में कॉपी या साझा करें
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Admin App Dedicated Link */}
              <div className="p-4 bg-slate-800/80 border-2 border-amber-400/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-300 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Admin App लिंक (केवल ऑपरेटर हेतु)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                    Operator Only
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  यह लिंक केवल ऑपरेटर व संचालक के उपयोग के लिए है। इसे अपने फोन या कम्प्यूटर में बुकमार्क करें।
                </p>
                <div className="p-2 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 truncate border border-slate-700">
                  {adminAppUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLink(adminAppUrl, 'Admin App लिंक')}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Admin App लिंक कॉपी करें</span>
                </button>
              </div>

              {/* Customer Portal Link */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    ग्राहक बुकिंग पोर्टल लिंक
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                    Customer Link
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  ग्राहक इस लिंक से सामान्य व इमरजेंसी अपॉइंटमेंट टोकन बुक कर सकते हैं।
                </p>
                <div className="p-2 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 truncate border border-slate-700">
                  {customerPortalUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLink(customerPortalUrl, 'ग्राहक पोर्टल लिंक')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>ग्राहक पोर्टल लिंक कॉपी करें</span>
                </button>
              </div>

              {/* 1-Click Quick Booking Link (QR 1) */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    त्वरित सरल बुकिंग लिंक (QR 1)
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Quick Booking
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  केवल नाम व मोबाइल से तुरंत 1-क्लिक सीधा टोकन प्राप्त करने का त्वरित लिंक।
                </p>
                <div className="p-2 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 truncate border border-slate-700">
                  {quickBookingUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLink(quickBookingUrl, 'त्वरित बुकिंग लिंक')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>त्वरित लिंक कॉपी करें</span>
                </button>
              </div>

              {/* TV Screen Link */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-amber-300" />
                    फुलस्क्रीन TV कतार स्क्रीन
                  </span>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                    Waiting TV Display
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  प्रतीक्षालय में बड़ी टीवी स्क्रीन पर चालू करने के लिए सीधा टीवी डिस्प्ले खोलें।
                </p>
                <button
                  type="button"
                  onClick={onOpenTvMode}
                  className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>TV डिस्प्ले खोलें (Full Screen)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onTokenCreated={() => {
          setIsManualModalOpen(false);
          onRefresh();
        }}
      />

      {/* Settings Modal (Owner Only) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={onSaveSettings}
        onResetTokens={onResetTokens}
      />

      {/* Staff Management Modal (Owner Only) */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        authToken={authToken}
        currentUser={currentUser}
      />

      {/* Disruption Control Modal */}
      <DisruptionControlModal
        isOpen={isDisruptionModalOpen}
        onClose={() => setIsDisruptionModalOpen(false)}
        disruption={meta.disruption || settings.disruption}
        authToken={authToken}
        onRefresh={onRefresh}
      />
    </div>
  );
};
