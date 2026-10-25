import React, { useEffect, useState, useCallback } from 'react';
import {
  FileSpreadsheet,
  QrCode,
  Tv,
  Settings,
  Users,
  Smartphone,
  CheckCircle2,
  Clock,
  Volume2,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  Lock,
  LogOut,
  ShieldCheck,
  Crown,
  Briefcase,
  UserCheck,
  AlertTriangle,
  Server,
  BookOpen,
  Headphones,
  ExternalLink
} from 'lucide-react';
import { TokenRecord, AppSettings, QueueMeta, TokenStatus, StaffUser } from './types';
import { CustomerForm } from './components/CustomerForm';
import { TokenSlip } from './components/TokenSlip';
import { CustomerQueueView } from './components/CustomerQueueView';
import { DataSheetTable } from './components/DataSheetTable';
import { CounterController } from './components/CounterController';
import { PrintableQrPoster } from './components/PrintableQrPoster';
import { TvDisplay } from './components/TvDisplay';
import { ManualEntryModal } from './components/ManualEntryModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { DisruptionControlModal } from './components/DisruptionControlModal';
import { HelpDeskModal } from './components/HelpDeskModal';
import { SelfBookingGuideModal } from './components/SelfBookingGuideModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AdminApp } from './components/AdminApp';
import { getTodayDateString } from './utils/time';

export default function App() {
  // Dedicated App Mode: 'customer' | 'admin'
  const [activeApp, setActiveApp] = useState<'customer' | 'admin'>(() => {
    if (typeof window === 'undefined') return 'customer';
    const p = new URLSearchParams(window.location.search);
    return p.get('app') === 'admin' || window.location.pathname.startsWith('/admin')
      ? 'admin'
      : 'customer';
  });

  const switchToAdminApp = useCallback(() => {
    setActiveApp('admin');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', 'admin');
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  const switchToCustomerApp = useCallback(() => {
    setActiveApp('customer');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('app');
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      setActiveApp(p.get('app') === 'admin' ? 'admin' : 'customer');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict Customer Mode for QR Scan (only appointment booking accessible)
  const [isQrScan] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search);
    const hasQrFlag =
      p.get('qr') === '1' ||
      p.get('source') === 'qr' ||
      p.get('mode') === 'simple' ||
      p.get('mode') === 'portal' ||
      p.get('scan') === '1';
    if (hasQrFlag) {
      try {
        sessionStorage.setItem('token_app_qr_scan_mode', 'true');
      } catch {}
      return true;
    }
    return sessionStorage.getItem('token_app_qr_scan_mode') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'customer_book' | 'customer_queue' | 'datasheet' | 'counter' | 'poster' | 'tv'>('customer_book');

  // Authentication state (Staff / Operator PIN)
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false);

  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [meta, setMeta] = useState<QueueMeta>({
    total: 0,
    todayTotal: 0,
    nowServing: null,
    nowServingItem: null,
    waitingCount: 0,
    completedCount: 0,
  });
  const [activeToken, setActiveToken] = useState<TokenRecord | null>(null);
  const [activeQueueInfo, setActiveQueueInfo] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
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
  });

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Restore session from localStorage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('token_app_auth_token');
    const savedUser = localStorage.getItem('token_app_user');
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token_app_auth_token');
        localStorage.removeItem('token_app_user');
      }
    }
  }, []);

  // Fetch settings
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((e) => console.warn('Could not load settings:', e));
  }, []);

  // Fetch tokens for selected date
  const loadTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tokens?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTokens(data.tokens || []);
          if (data.meta) {
            setMeta(data.meta);
          }
          if (data.disruption) {
            setSettings((prev) => ({ ...prev, disruption: data.disruption }));
          }
        }
      }
    } catch (err) {
      console.warn('Tokens fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Periodic polling every 4.5 seconds for real-time sync across devices
  useEffect(() => {
    loadTokens();
    const interval = setInterval(loadTokens, 4500);
    return () => clearInterval(interval);
  }, [loadTokens]);

  // Handle URL query parameters & Token auto-restore
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenQuery = params.get('token');
    const adminQuery = params.get('admin');

    if (tokenQuery) {
      fetch(`/api/tokens/${tokenQuery}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.token) {
            setActiveToken(data.token);
            setActiveQueueInfo(data.queueInfo);
            setActiveTab('customer_book');
            try {
              localStorage.setItem('my_last_token_id', data.token.id);
            } catch {}
          }
        })
        .catch(() => {});
    } else {
      // Auto-restore token on screen reload / close if customer has active token
      try {
        const savedTokenId = localStorage.getItem('my_last_token_id');
        if (savedTokenId) {
          fetch(`/api/tokens/${savedTokenId}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.token) {
                const today = getTodayDateString();
                const isTodayOrActive =
                  data.token.slotDate === today ||
                  data.token.status === 'waiting' ||
                  data.token.status === 'called' ||
                  data.token.status === 'in_progress';
                if (isTodayOrActive) {
                  setActiveToken(data.token);
                  setActiveQueueInfo(data.queueInfo);
                  setActiveTab('customer_book');
                }
              }
            })
            .catch(() => {});
        }
      } catch {}
    }

    if (!isQrScan && adminQuery === 'login') {
      setIsLoginModalOpen(true);
    }
  }, [isQrScan]);

  const handleLoginSuccess = (user: StaffUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('token_app_auth_token', token);
    localStorage.setItem('token_app_user', JSON.stringify(user));
    setActiveTab('datasheet');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {}
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('token_app_auth_token');
    localStorage.removeItem('token_app_user');
    setActiveTab('customer_book');
  };

  // Handle Token Generation from Customer Form
  const handleTokenGenerated = (token: TokenRecord, queueInfo: any) => {
    setActiveToken(token);
    setActiveQueueInfo(queueInfo);
    loadTokens();
  };

  // Update token status (Staff or Owner only)
  const handleUpdateStatus = async (id: string, status: TokenStatus, counter?: number) => {
    if (!authToken) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/tokens/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status, counter }),
      });
      if (res.ok) {
        loadTokens();
        if (activeToken && activeToken.id === id) {
          setActiveToken((prev) => (prev ? { ...prev, status, counter: counter ?? prev.counter } : null));
        }
      } else {
        const data = await res.json();
        alert(data.error || 'अपडेट करने की अनुमति नहीं है।');
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Delete token (Owner ONLY!)
  const handleDeleteToken = async (id: string) => {
    if (!currentUser || currentUser.role !== 'owner') {
      alert('केवल संचालक (Owner) को टोकन हटाने की अनुमति है।');
      return;
    }

    try {
      const res = await fetch(`/api/tokens/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        loadTokens();
        if (activeToken && activeToken.id === id) {
          setActiveToken(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'हटाने की अनुमति अस्वीकृत।');
      }
    } catch (err) {
      console.error('Delete token error:', err);
    }
  };

  // Save Settings (Owner only)
  const handleSaveSettings = async (newSettings: AppSettings) => {
    if (!currentUser || currentUser.role !== 'owner') {
      alert('केवल Owner सेटिंग्स बदल सकते हैं।');
      return;
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        setSettings(newSettings);
      } else {
        const data = await res.json();
        alert(data.error || 'सेटिंग्स बदलने की अनुमति नहीं है।');
      }
    } catch (err) {
      console.error('Settings save error:', err);
    }
  };

  // Reset tokens (Owner only)
  const handleResetTokens = async () => {
    if (!currentUser || currentUser.role !== 'owner') {
      alert('केवल Owner आज के टोकन रीसेट कर सकते हैं।');
      return;
    }

    try {
      const res = await fetch('/api/tokens/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ date: selectedDate }),
      });
      if (res.ok) {
        setActiveToken(null);
        loadTokens();
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // DEDICATED ADMIN APP MODE (Only for Operator & Admin use)
  if (activeApp === 'admin') {
    return (
      <AdminApp
        tokens={tokens}
        meta={meta}
        settings={settings}
        currentUser={currentUser}
        authToken={authToken}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onUpdateStatus={handleUpdateStatus}
        onDeleteToken={handleDeleteToken}
        onSaveSettings={handleSaveSettings}
        onResetTokens={handleResetTokens}
        onRefresh={loadTokens}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        isLoading={isLoading}
        onSwitchToCustomer={switchToCustomerApp}
        onOpenTvMode={() => {
          setActiveTab('tv');
          switchToCustomerApp();
        }}
        onOpenPosterMode={() => {
          setActiveTab('poster');
          switchToCustomerApp();
        }}
      />
    );
  }

  // Fullscreen TV Mode (disabled in QR customer scan mode)
  if (!isQrScan && activeTab === 'tv') {
    return (
      <TvDisplay
        tokens={tokens}
        centerName={settings.centerName}
        onClose={() => setActiveTab(currentUser ? 'datasheet' : 'customer_book')}
      />
    );
  }

  const isStaffOrOwner = !isQrScan && Boolean(currentUser);
  const isOwner = !isQrScan && currentUser?.role === 'owner';
  const effectiveTab = isQrScan ? 'customer_book' : activeTab;
  const currentDisruption = meta.disruption || settings.disruption;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Global Disruption Banner for all views if active */}
      {currentDisruption && (currentDisruption.isPaused || currentDisruption.message) && (
        <div className="bg-amber-500 text-slate-950 font-black px-4 py-2 text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
          <span>{currentDisruption.message}</span>
          {isStaffOrOwner && (
            <button
              onClick={() => setIsDisruptionModalOpen(true)}
              className="ml-2 underline text-xs text-slate-950 font-bold hover:text-white cursor-pointer"
            >
              (कंट्रोल बदलें)
            </button>
          )}
        </div>
      )}

      {/* Top Application Navigation Bar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div
              onClick={() => {
                setActiveToken(null);
                setActiveTab('customer_book');
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
                TK
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight block leading-tight">
                  स्मार्ट टोकन सिस्टम
                </span>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {isStaffOrOwner ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      {isOwner ? '👑 संचालक पैनल (Owner)' : '👔 स्टाफ पैनल (Staff)'}
                    </span>
                  ) : (
                    'ग्राहक सेवा पोर्टल (Customer)'
                  )}
                </span>
              </div>
            </div>

            {/* Navigation Tabs based on Role */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => {
                  setActiveToken(null);
                  setActiveTab('customer_book');
                }}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  effectiveTab === 'customer_book'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>अपॉइंटमेंट बुक</span>
              </button>

              {/* Hide Live Katar if customer opened via QR Scan */}
              {!isQrScan && (
                <button
                  onClick={() => setActiveTab('customer_queue')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    effectiveTab === 'customer_queue'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="कतार स्थिति देखें (Customer View)"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>लाइव कतार</span>
                </button>
              )}

              <button
                onClick={() => setIsGuideOpen(true)}
                className="px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-amber-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                title="खुद से अपॉइंटमेंट बुक कैसे करें? (गाइड व नियम)"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">बुकिंग गाइड</span>
              </button>

              <button
                onClick={() => setIsHelpDeskOpen(true)}
                className="px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-indigo-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                title="हेल्प डेस्क एवं सहायता"
              >
                <Headphones className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">हेल्प डेस्क</span>
              </button>

              {/* Hide Poster if customer opened via QR scan */}
              {!isQrScan && (
                <button
                  onClick={() => setActiveTab('poster')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    effectiveTab === 'poster'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="2-QR कोड पोस्टर देखें (Dual QR Poster)"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">2-QR पोस्टर</span>
                </button>
              )}

              {/* Protected Staff & Admin Tabs (Hidden completely in QR Scan Customer Mode) */}
              {isStaffOrOwner && (
                <>
                  <button
                    onClick={() => setActiveTab('datasheet')}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      effectiveTab === 'datasheet'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="hidden md:inline">डेटा शीट</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('counter')}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      effectiveTab === 'counter'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="hidden md:inline">काउंटर</span> कॉल
                  </button>

                  {/* Disruption / Server Error Control */}
                  <button
                    onClick={() => setIsDisruptionModalOpen(true)}
                    className="px-2.5 py-2 text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="UIDAI सर्वर एरर / टाइम कंट्रोल"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden lg:inline">सर्वर एरर</span> कंट्रोल
                  </button>

                  {/* Owner Only: Staff Management */}
                  {isOwner && (
                    <button
                      onClick={() => setIsStaffModalOpen(true)}
                      className="px-2.5 py-2 text-indigo-300 hover:text-indigo-200 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="स्टाफ एवं ओनर बनाएं (Staff & Owner Management)"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">स्टाफ</span> प्रबंधन
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('tv')}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="प्रतीक्षालय टीवी स्क्रीन"
                  >
                    <Tv className="w-4 h-4" />
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                      title="केंद्र सेटिंग्स"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              {/* In-App PWA Install Button */}
              <div className="pl-1">
                <PWAInstallButton />
              </div>

              {/* Dedicated Admin App Launch Button */}
              {!isQrScan && (
                <button
                  type="button"
                  onClick={switchToAdminApp}
                  className="ml-1 inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                  title="Admin App - केवल ऑपरेटर व एडमिन हेतु"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  <span>Admin App</span>
                </button>
              )}

              {/* Login / Logout Button - Strictly Hidden in QR Scan Customer Mode */}
              {isStaffOrOwner ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                  <div className="hidden sm:block text-right">
                    <span className="text-xs font-bold text-white block leading-tight">
                      {currentUser?.name}
                    </span>
                    <span className="text-[10px] text-amber-300 uppercase font-mono">
                      {currentUser?.role === 'owner' ? '👑 Owner' : '👔 Staff'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-300 hover:text-white hover:bg-rose-900/40 rounded-xl transition cursor-pointer"
                    title="लॉगआउट करें"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                !isQrScan && (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="ml-1 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">लॉगिन</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Operator Live KPI ribbon when in Admin tabs */}
      {isStaffOrOwner && activeTab !== 'customer_book' && activeTab !== 'customer_queue' && (
        <div className="bg-white border-b border-slate-200 shadow-xs no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">आज कुल टोकन</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {meta.todayTotal}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5">
                <span className="text-[11px] font-bold text-amber-800 uppercase">कतार में प्रतीक्षारत</span>
                <p className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
                  {meta.waitingCount}
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-2.5">
                <span className="text-[11px] font-bold text-indigo-800 uppercase">वर्तमान टोकन</span>
                <p className="text-xl sm:text-2xl font-black text-indigo-900 font-mono">
                  {meta.nowServing || 'खाली है'}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">पूर्ण कार्य</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                  {meta.completedCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB 1: Customer Booking Form or Slip */}
        {effectiveTab === 'customer_book' && (
          <div>
            {activeToken ? (
              <TokenSlip
                token={activeToken}
                queueInfo={activeQueueInfo}
                centerName={settings.centerName}
                disruption={currentDisruption}
                onReset={() => {
                  setActiveToken(null);
                  try {
                    localStorage.removeItem('my_last_token_id');
                  } catch {}
                }}
              />
            ) : (
              <CustomerForm
                onTokenGenerated={handleTokenGenerated}
                centerName={settings.centerName}
                nowServing={meta.nowServing}
                waitingCount={meta.waitingCount}
                disruption={currentDisruption}
              />
            )}
          </div>
        )}

        {/* TAB 2: Customer Safe Read-Only Public Queue View */}
        {!isQrScan && effectiveTab === 'customer_queue' && (
          <CustomerQueueView
            tokens={tokens}
            centerName={settings.centerName}
            nowServing={meta.nowServing}
            nowServingItem={meta.nowServingItem}
            waitingCount={meta.waitingCount}
            onBookNewToken={() => setActiveTab('customer_book')}
            onDeleteToken={handleDeleteToken}
          />
        )}

        {/* TAB 3: Data Sheet (Staff or Owner) */}
        {!isQrScan && effectiveTab === 'datasheet' && isStaffOrOwner && (
          <DataSheetTable
            tokens={tokens}
            onRefresh={loadTokens}
            onUpdateStatus={handleUpdateStatus}
            onDeleteToken={handleDeleteToken}
            onOpenManualEntry={() => setIsManualModalOpen(true)}
            onOpenDisruptionModal={() => setIsDisruptionModalOpen(true)}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            isLoading={isLoading}
            currentUser={currentUser}
            authToken={authToken}
          />
        )}

        {/* TAB 4: Counter Caller (Staff or Owner) */}
        {!isQrScan && effectiveTab === 'counter' && isStaffOrOwner && (
          <CounterController
            tokens={tokens}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* TAB 5: Printable Poster */}
        {!isQrScan && effectiveTab === 'poster' && (
          <PrintableQrPoster
            centerName={settings.centerName}
            centerAddress={settings.centerAddress}
          />
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={!isQrScan && isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {currentUser && !isQrScan && (
        <StaffManagementModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          authToken={authToken}
          currentUser={currentUser}
        />
      )}

      {isStaffOrOwner && (
        <DisruptionControlModal
          isOpen={isDisruptionModalOpen}
          onClose={() => setIsDisruptionModalOpen(false)}
          authToken={authToken}
          disruption={currentDisruption}
          onRefresh={loadTokens}
        />
      )}

      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onTokenCreated={(token) => {
          loadTokens();
          setActiveToken(token);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetTokens={handleResetTokens}
      />

      {/* Global Booking Guide Modal */}
      <SelfBookingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartBooking={() => {
          setIsGuideOpen(false);
          setActiveToken(null);
          setActiveTab('customer_book');
        }}
      />

      {/* Global Help Desk Modal */}
      <HelpDeskModal
        isOpen={isHelpDeskOpen}
        onClose={() => setIsHelpDeskOpen(false)}
        centerName={settings.centerName}
        centerAddress={settings.centerAddress}
      />

      {/* Clean Footer with Regional Office Varanasi Lahartara Appointment Link & Admin shortcut */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto space-y-3.5">
          {/* Official UIDAI Portals: Regional Office Varanasi Appointment & Aadhaar Status Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Regional Office Varanasi (Lahartara) Appointment Link */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-indigo-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                    🏛️ क्षेत्रीय कार्यालय वाराणसी (लहरतारा)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    ASK लहरतारा, वाराणसी हेतु आधिकारिक अपॉइंटमेंट बुक करें
                  </span>
                </div>
              </div>
              <a
                href="https://bookappointment.uidai.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition hover:shadow-md shrink-0 cursor-pointer"
              >
                <span>Book Appointment</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 2. Check Aadhaar Update Status Link */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                    🔍 आधार अपडेट स्थिति जांचें (Status)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    EID / SRN नंबर से आधार संशोधन/अपडेट की लाइव स्थिति देखें
                  </span>
                </div>
              </div>
              <a
                href="https://myaadhaar.uidai.gov.in/CheckAadhaarStatus/en"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition hover:shadow-md shrink-0 cursor-pointer"
              >
                <span>Check Status</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-center sm:text-left">
            <span>{settings.centerName} • समय: सुबह 9:00 से शाम 4:00 (10 मिनट अंतराल)</span>
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <span className="font-semibold text-slate-700">
                डिजिटल टोकन एवं स्वचालित डेटा शीट
              </span>
              {!isStaffOrOwner && !isQrScan && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  स्टाफ / एडमिन पोर्टल
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
