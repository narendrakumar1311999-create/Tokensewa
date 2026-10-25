import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Clock, Volume2, Sparkles, Maximize2, QrCode } from 'lucide-react';
import { TokenRecord } from '../types';

interface TvDisplayProps {
  tokens: TokenRecord[];
  centerName?: string;
  onClose?: () => void;
}

export const TvDisplay: React.FC<TvDisplayProps> = ({
  tokens,
  centerName = 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrUrl, setQrUrl] = useState('');
  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentAppUrl) {
      QRCode.toDataURL(currentAppUrl, {
        width: 320,
        margin: 1,
        color: { dark: '#020617', light: '#ffffff' },
      }).then(setQrUrl);
    }
  }, [currentAppUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Active serving token
  const nowServing = tokens.find((t) => t.status === 'called' || t.status === 'in_progress');
  const waitingTokens = tokens.filter((t) => t.status === 'waiting').slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            लाइव कतार डिस्प्ले बोर्ड (LIVE TOKEN DISPLAY)
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
            {centerName}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right font-mono">
            <div className="text-2xl sm:text-4xl font-extrabold text-amber-300">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400">
              {currentTime.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition cursor-pointer"
              title="फुल स्क्रीन"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                बंद करें
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
        {/* BIG NOW SERVING CARD */}
        <div className="lg:col-span-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500/40 rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-4 py-1.5 rounded-full text-sm font-black tracking-wider uppercase mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              अब सेवा जारी है (NOW SERVING)
            </div>

            {nowServing ? (
              <div className="space-y-6">
                <div className="flex items-baseline gap-6">
                  <div className="text-8xl sm:text-9xl font-black font-mono text-amber-300 tracking-tight drop-shadow-lg">
                    {nowServing.tokenDisplay}
                  </div>
                  <div className="text-xl sm:text-3xl font-extrabold text-indigo-300 bg-indigo-900/50 px-4 py-2 rounded-2xl border border-indigo-500/30">
                    काउंटर {nowServing.counter || 1}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <p className="text-3xl sm:text-5xl font-black text-white">{nowServing.name}</p>
                  <p className="text-lg sm:text-xl text-emerald-400 font-bold mt-2">
                    {nowServing.serviceLabel}
                  </p>
                  <p className="text-sm font-mono text-slate-400 mt-1">
                    स्लॉट: {nowServing.slotFullText} • ID: {nowServing.uniqueId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <p className="text-4xl sm:text-5xl font-black text-slate-300">अगले ग्राहक की प्रतीक्षा है</p>
                <p className="text-lg text-slate-500 mt-3">कृपया अपना टोकन नंबर पुकारे जाने पर काउंटर पर आएं।</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-xs sm:text-sm text-slate-400 flex items-center justify-between">
            <span>समय सारणी: <strong>सुबह 9:00 से शाम 4:00</strong></span>
            <span>प्रति स्लॉट: <strong>10 मिनट</strong></span>
          </div>
        </div>

        {/* SIDE COLUMN: Next Tokens & QR Scan */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          {/* Next in line */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              अगले 4 टोकन (NEXT IN LINE)
            </h3>

            {waitingTokens.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">कतार में कोई प्रतीक्षा नहीं कर रहा।</p>
            ) : (
              <div className="space-y-3">
                {waitingTokens.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-10 rounded-xl bg-indigo-600 text-white font-mono font-black text-base flex items-center justify-center">
                        {t.tokenDisplay}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-white truncate max-w-[130px]">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.slotStartTime}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 px-2 py-1 rounded-lg">
                      क्रम #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Code Scan Promo */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-700/50 rounded-3xl p-6 text-center shadow-xl">
            <p className="text-xs uppercase font-extrabold tracking-wider text-indigo-200 mb-2">
              नया टोकन प्राप्त करें
            </p>
            <p className="text-sm font-bold text-white mb-3">
              मोबाइल से QR कोड स्कैन करें
            </p>

            <div className="inline-block p-2 bg-white rounded-2xl shadow-md">
              {qrUrl ? (
                <img src={qrUrl} alt="Scan QR" className="w-36 h-36 mx-auto" />
              ) : (
                <div className="w-36 h-36 bg-slate-200" />
              )}
            </div>

            <p className="text-[11px] text-indigo-200 mt-2 font-medium">
              10 मिनट का समय व टोकन पर्ची तुरंत पाएं
            </p>
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <footer className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
        📢 सभी ग्राहक कृपया अपना टोकन नंबर आने पर काउंटर पर पधारें। बिना टोकन कार्य नहीं किया जाएगा।
      </footer>
    </div>
  );
};
