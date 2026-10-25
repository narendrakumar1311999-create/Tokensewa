import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  SkipForward,
  UserCheck,
  Clock,
  Phone,
  MessageCircle,
  Sparkles,
  Users,
  Play
} from 'lucide-react';
import { TokenRecord, TokenStatus } from '../types';
import { announceToken, playChime } from '../utils/audio';

interface CounterControllerProps {
  tokens: TokenRecord[];
  onUpdateStatus: (id: string, status: TokenStatus, counter?: number) => void;
  selectedCounter?: number;
  onSelectCounter?: (counter: number) => void;
}

export const CounterController: React.FC<CounterControllerProps> = ({
  tokens,
  onUpdateStatus,
  selectedCounter = 1,
  onSelectCounter,
}) => {
  const [activeCounter, setActiveCounter] = useState(selectedCounter);

  // Current token serving
  const currentToken = tokens.find(
    (t) => (t.status === 'called' || t.status === 'in_progress') && (t.counter === activeCounter || !t.counter)
  );

  // Waiting tokens in order
  const waitingTokens = tokens.filter((t) => t.status === 'waiting');
  const nextToken = waitingTokens[0];

  const handleCallNext = () => {
    if (nextToken) {
      announceToken(nextToken.tokenDisplay, activeCounter, nextToken.name);
      onUpdateStatus(nextToken.id, 'called', activeCounter);
    } else {
      playChime();
    }
  };

  const handleRecallCurrent = () => {
    if (currentToken) {
      announceToken(currentToken.tokenDisplay, activeCounter, currentToken.name);
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

  return (
    <div className="space-y-6">
      {/* Top Counter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-indigo-600" />
            काउंटर कॉलिंग कंट्रोलर (Desk Queue Caller)
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            बटन दबाते ही ध्वनि घंटी बजेगी और हिंदी में बोलकर टोकन नंबर पुकारा जाएगा।
          </p>
        </div>

        {/* Counter selector tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => {
                setActiveCounter(num);
                onSelectCounter?.(num);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCounter === num
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              काउंटर {num}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Current Serving Box */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                काउंटर {activeCounter} - वर्तमान सेवा (NOW SERVING)
              </span>

              {currentToken && (
                <span className="text-xs text-indigo-200 font-mono">
                  बुलाया समय:{' '}
                  {currentToken.calledAt
                    ? new Date(currentToken.calledAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'अभी'}
                </span>
              )}
            </div>

            {currentToken ? (
              <div className="space-y-4 my-2">
                  <div className="flex items-baseline gap-4">
                    <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${
                      currentToken.isEmergency ? 'text-rose-400' : 'text-amber-300'
                    }`}>
                      {currentToken.tokenDisplay}
                    </div>
                    <div className="bg-indigo-800/60 border border-indigo-600/40 px-3.5 py-1 rounded-xl font-mono text-sm text-indigo-200">
                      {currentToken.uniqueId}
                    </div>
                    {currentToken.isEmergency && (
                      <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-xl shadow-xs animate-pulse">
                        🚨 इमरजेंसी (+₹50 शुल्क)
                      </span>
                    )}
                  </div>

                  <div className="border-t border-indigo-800/60 pt-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span>{currentToken.name}</span>
                      {currentToken.isEmergency && (
                        <span className="text-xs bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md">
                          इमरजेंसी ग्राहक
                        </span>
                      )}
                    </h3>
                  <p className="text-indigo-200 text-sm mt-1 flex items-center gap-2">
                    <span className="bg-indigo-700/60 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                      {currentToken.serviceLabel}
                    </span>
                    <span className="font-mono text-slate-300">+91 {currentToken.mobile}</span>
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl max-w-fit">
                    <Clock className="w-3.5 h-3.5" />
                    <span>स्लॉट: {currentToken.slotFullText}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-indigo-300/80">
                <p className="text-3xl font-extrabold text-white">काउंटर खाली है (Ready)</p>
                <p className="text-sm mt-2 text-indigo-200">
                  नीचे दिए गए "अगला टोकन बुलाएं" बटन पर क्लिक करके कतार से ग्राहक को पुकारें।
                </p>
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="pt-6 mt-6 border-t border-indigo-800/60 space-y-3">
            {currentToken ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={handleRecallCurrent}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  पुनः आवाज लगाएं
                </button>

                <button
                  onClick={handleCompleteCurrent}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  कार्य पूर्ण (Done)
                </button>

                <button
                  onClick={handleSkipCurrent}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  अनुपस्थित / छोड़ें
                </button>
              </div>
            ) : (
              <button
                onClick={handleCallNext}
                disabled={!nextToken}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                अगला टोकन बुलाएं {nextToken ? `(${nextToken.tokenDisplay})` : '(कतार खाली है)'}
              </button>
            )}

            {/* If currently serving someone, also allow calling next right away */}
            {currentToken && nextToken && (
              <button
                onClick={handleCallNext}
                className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                अगला टोकन {nextToken.tokenDisplay} ({nextToken.name}) बुलाएं
              </button>
            )}
          </div>
        </div>

        {/* Next in Queue List */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-indigo-600" />
                प्रतीक्षारत कतार ({waitingTokens.length} लोग)
              </h3>
              <span className="text-xs font-semibold text-slate-500">10 मिनट स्लॉट अनुसार</span>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="font-semibold text-slate-600">कतार में कोई प्रतीक्षा नहीं कर रहा</p>
                <p className="text-xs text-slate-400 mt-1">
                  दुकान के बाहर लगे QR कोड को स्कैन करके ग्राहक नया टोकन ले सकते हैं।
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {waitingTokens.slice(0, 8).map((t, idx) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      idx === 0
                        ? 'border-indigo-300 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-12 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center font-mono shrink-0 ${
                        t.isEmergency ? 'bg-rose-600 shadow-sm animate-pulse' : 'bg-indigo-900'
                      }`}>
                        {t.tokenDisplay}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-slate-900 truncate">{t.name}</p>
                          {t.isEmergency && (
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-black rounded-md">
                              इमरजेंसी (+₹50)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{t.slotFullText}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        announceToken(t.tokenDisplay, activeCounter, t.name);
                        onUpdateStatus(t.id, 'called', activeCounter);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      बुलाएं
                    </button>
                  </div>
                ))}

                {waitingTokens.length > 8 && (
                  <p className="text-center text-xs text-slate-400 py-1">
                    + और {waitingTokens.length - 8} लोग कतार में प्रतीक्षारत हैं
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>स्लॉट अंतराल: <strong>10 मिनट</strong></span>
            <span>ऑटो-स्पीच: <strong>हिंदी आवाज</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
