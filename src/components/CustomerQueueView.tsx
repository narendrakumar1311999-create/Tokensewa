import React, { useState } from 'react';
import {
  Users,
  Clock,
  Search,
  Sparkles,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  Calendar,
  Flame,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { TokenRecord } from '../types';
import { getTodayDateString } from '../utils/time';
import { checkPostOfficeClosed, getNextWorkingDay } from '../utils/holidays';

interface CustomerQueueViewProps {
  tokens: TokenRecord[];
  centerName?: string;
  nowServing?: string | null;
  nowServingItem?: TokenRecord | null;
  waitingCount?: number;
  onBookNewToken: () => void;
  onDeleteToken?: (id: string) => void;
}

export const CustomerQueueView: React.FC<CustomerQueueViewProps> = ({
  tokens,
  centerName = 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  nowServing,
  nowServingItem,
  waitingCount = 0,
  onBookNewToken,
  onDeleteToken,
}) => {
  const [search, setSearch] = useState('');
  const todayStr = getTodayDateString();
  const todayClosed = checkPostOfficeClosed(todayStr);

  const filtered = tokens.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.tokenDisplay.toLowerCase().includes(q) ||
      t.uniqueId.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'called':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            बुलाया गया (Please Reach Counter)
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            कार्य जारी है
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            पूर्ण
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            प्रतीक्षारत
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Holiday / Sunday Closed Banner if applicable */}
      {todayClosed.isClosed && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-950 p-4 rounded-3xl shadow-sm flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-rose-900">
              आज केंद्र बंद है: {todayClosed.reason}
            </h3>
            <p className="text-xs text-rose-800 font-medium mt-0.5">
              रविवार एवं सरकारी डाकघर अवकाश के दिन आधार केंद्र बंद रहता है। अगला कार्यदिवस: <strong>{getNextWorkingDay(todayStr)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-br from-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-600/60 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-100 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            लाइव कतार स्थिति (Live Public Queue)
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">{centerName}</h2>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1">
            यहाँ आप लाइव देख सकते हैं कि अभी कौन सा नंबर चल रहा है और लाइन में कितने लोग हैं।
          </p>

          {/* Big Now Serving Spotlight */}
          <div className="mt-5 p-4 bg-indigo-950/70 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300 block">
                ⚡ अभी काउंटर 1 पर सेवा जारी है:
              </span>
              <div className="flex items-center gap-2">
                <div className={`text-3xl sm:text-4xl font-black font-mono mt-0.5 ${
                  nowServingItem?.isEmergency ? 'text-rose-400' : 'text-amber-300'
                }`}>
                  {nowServing || 'काउंटर खाली है'}
                </div>
                {nowServingItem?.isEmergency && (
                  <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    🚨 इमरजेंसी
                  </span>
                )}
              </div>
              {nowServingItem && (
                <p className="text-xs text-indigo-200 mt-1">
                  {nowServingItem.name} • {nowServingItem.serviceLabel}
                  {nowServingItem.isEmergency && ' • (इमरजेंसी +₹50)'}
                </p>
              )}
            </div>

            <button
              onClick={onBookNewToken}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer self-stretch sm:self-center text-center"
            >
              + नया टोकन लें (Book Token)
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="अपना नाम, टोकन नंबर (TK-..) या यूनिक ID खोजें..."
          className="w-full bg-transparent text-sm focus:outline-none font-medium text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* Read-Only Public List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold">
          <span>कतार सूची (आज कुल: {tokens.length} टोकन)</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            ग्राहक केवल-देखने योग्य मोड (Read-Only)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-semibold text-slate-600">कोई टोकन नहीं मिला</p>
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  t.status === 'called' ? 'bg-amber-50/70' : ''
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-14 h-11 rounded-2xl text-white font-black text-base flex items-center justify-center font-mono shrink-0 shadow-xs ${
                    t.isEmergency ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-indigo-900'
                  }`}>
                    {t.tokenDisplay}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {t.name}
                      </span>
                      {t.isEmergency && (
                        <span className="inline-flex items-center gap-0.5 bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3 fill-rose-600 text-rose-600" />
                          इमरजेंसी (+₹50)
                        </span>
                      )}
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {t.uniqueId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.serviceLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      {t.slotFullText}
                    </span>
                    <span className="text-[10px] text-slate-400 block">10 मिनट स्लॉट</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div>{getStatusBadge(t.status)}</div>
                    {onDeleteToken && (
                      <button
                        onClick={() => onDeleteToken(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="टोकन हटाएं / रद्द करें (Delete Token)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
