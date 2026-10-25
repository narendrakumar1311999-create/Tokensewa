import React, { useState } from 'react';
import {
  X,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { TokenRecord } from '../types';

interface CustomerTokenLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenRecord) => void;
}

export const CustomerTokenLookupModal: React.FC<CustomerTokenLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/tokens?search=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.tokens || []);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [confirmTokenId, setConfirmTokenId] = useState<string | null>(null);

  const handleDelete = async (token: TokenRecord) => {
    try {
      const res = await fetch(`/api/tokens/${token.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults((prev) => prev.filter((t) => t.id !== token.id));
        setActionMessage(`टोकन ${token.tokenDisplay} (${token.name}) सफलतापूर्वक रद्द व हटा दिया गया।`);
        setConfirmTokenId(null);
      } else {
        setActionMessage(data.error || 'टोकन हटाने में असमर्थ।');
      }
    } catch {
      setActionMessage('नेटवर्क त्रुटि: टोकन नहीं हटाया जा सका।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              टोकन खोजें एवं रद्द / डिलीट करें
            </h3>
            <p className="text-xs text-slate-500">
              अपना मोबाइल नंबर या टोकन नंबर दर्ज करके टोकन हटाएं या देखें
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="आधार नंबर (12 अंक), मोबाइल या टोकन नंबर..."
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
            >
              {isLoading ? 'खोज...' : 'खोजें'}
            </button>
          </div>
        </form>

        {actionMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Results */}
        <div className="mt-5 space-y-3">
          {hasSearched && results.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              कोई टोकन नहीं मिला। कृपया नंबर जांचें।
            </div>
          )}

          {results.map((t) => (
            <div
              key={t.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-12 h-10 rounded-xl font-mono font-black text-sm text-white flex items-center justify-center shrink-0 ${
                  t.isEmergency ? 'bg-rose-600' : 'bg-indigo-900'
                }`}>
                  {t.tokenDisplay}
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-slate-900 truncate">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    {t.slotFullText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelectToken(t);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  देखें
                </button>

                {confirmTokenId === t.id ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
                    >
                      ✓ निश्चित हटाएं
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTokenId(null)}
                      className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      रद्द
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmTokenId(t.id)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>हटाएं</span>
                  </button>
                )}
              </div>
            </div>
          ))}
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
