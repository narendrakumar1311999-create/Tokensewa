import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight, User } from 'lucide-react';
import { StaffUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: StaffUser, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('कृपया लॉगिन पिन दर्ज करें।');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'लॉगिन विफल। कृपया सही पिन डालें।');
      }

      onLoginSuccess(data.user, data.token);
      setPin('');
      setUsername('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'लॉगिन में त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (quickPin: string, quickUser: string) => {
    setPin(quickPin);
    setUsername(quickUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            स्टाफ एवं एडमिन लॉगिन
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            सुरक्षित प्रवेश: केवल अधिकृत स्टाफ एवं संचालक (Owner) ही डेटा शीट, कॉलिंग व सेटिंग्स का प्रबंधन कर सकते हैं।
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              यूज़रनेम (वैकल्पिक / Optional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin या staff (या केवल पिन डालें)"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              लॉगिन पिन / पासवर्ड *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                autoFocus
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4 अंकों का पिन (उदा. 2810)"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              'सत्यापन हो रहा है...'
            ) : (
              <>
                <span>सुरक्षित लॉगिन करें</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            लॉगिन पासवर्ड (Admin & Staff PINs)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('2810', 'admin')}
              className="p-2 bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-bold text-slate-900 truncate">👑 Admin</div>
              <div className="text-[11px] font-mono text-amber-700 font-black">2810</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('2811', 'staff1')}
              className="p-2 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-bold text-slate-900 truncate">👔 Staff 1</div>
              <div className="text-[11px] font-mono text-indigo-700 font-black">2811</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('2580', 'staff2')}
              className="p-2 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-bold text-slate-900 truncate">👔 Staff 2</div>
              <div className="text-[11px] font-mono text-emerald-700 font-black">2580</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
