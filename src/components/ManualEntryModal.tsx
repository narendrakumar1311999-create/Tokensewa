import React, { useState } from 'react';
import { X, UserPlus, Smartphone, Fingerprint, Plus, CheckCircle2, FileEdit, Check, Home, Users } from 'lucide-react';
import { ServiceType, TokenRecord } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenCreated: (token: TokenRecord) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onTokenCreated,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [service, setService] = useState<ServiceType>('mobile_update');
  const [isAddressChange, setIsAddressChange] = useState(false);
  const [isRelationChange, setIsRelationChange] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('कृपया ग्राहक का नाम दर्ज करें।');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('कृपया 10 अंकों का मान्य मोबाइल नंबर भरें।');
      return;
    }

    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      setError('आधार नंबर अनिवार्य है! कृपया 12 अंकों का सही आधार नंबर भरें। (1 आधार = 1 टोकन)');
      return;
    }

    const correctionOptions: string[] = [];
    if (service === 'correction') {
      if (!isAddressChange && !isRelationChange) {
        setError('कृपया सुधार के प्रकार में से कम से कम एक विकल्प (Address Change या S/O D/O W/O) चुनें।');
        return;
      }
      if (isAddressChange) correctionOptions.push('Address Change (पता सुधार)');
      if (isRelationChange) correctionOptions.push('S/O, D/O, W/O (अभिभावक सुधार)');
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile: cleanMobile,
          aadhaar: cleanAadhaar,
          service,
          correctionOptions: correctionOptions.length > 0 ? correctionOptions : undefined,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'टोकन बनाने में विफल');
      }

      onTokenCreated(data.token);
      setName('');
      setMobile('');
      setAadhaar('');
      setNotes('');
      setIsAddressChange(false);
      setIsRelationChange(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            काउंटर ऑपरेटर एंट्री
          </span>
          <h3 className="text-xl font-black text-slate-900">
            मैन्युअल टोकन बनाएं (Walk-in Customer)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            बुजुर्ग या बिना स्मार्टफोन वाले ग्राहकों के लिए काउंटर से सीधा टोकन निकालें।
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. ग्राहक का नाम *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. राजेश कुमार"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. 10 अंकों का मोबाइल नंबर *
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-300 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="px-3 bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 bg-transparent text-sm focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                3. आधार कार्ड नंबर (12 अंक) *
              </label>
              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                अनिवार्य (1 आधार = 1 टोकन)
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={12}
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
              placeholder="12 अंकों का आधार नंबर"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none font-mono tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              4. काम का प्रकार चुनें *
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setService('mobile_update')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  service === 'mobile_update'
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  1. मोबाइल नंबर अपडेट करवाना है
                </span>
              </label>

              <label
                onClick={() => setService('biometric_update')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  service === 'biometric_update'
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  2. बायोमेट्रिक अपडेट (फोटो/फिंगरप्रिंट)
                </span>
              </label>

              <label
                onClick={() => setService('new_enrollment')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  service === 'new_enrollment'
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-800">
                  3. नया इनरोलमेंट बनवाना है
                </span>
              </label>

              <label
                onClick={() => setService('correction')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  service === 'correction'
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileEdit className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">
                  4. आधार सुधार / करेक्शन (Correction)
                </span>
              </label>
            </div>

            {/* Sub-options for correction */}
            {service === 'correction' && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-900 block">
                  सुधार के प्रकार (एक या दोनों चुनें):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    onClick={() => setIsAddressChange(!isAddressChange)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none text-xs font-bold ${
                      isAddressChange ? 'bg-amber-100 border-amber-500 text-amber-950' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAddressChange ? 'bg-amber-600 text-white' : 'bg-white'}`}>
                      {isAddressChange && <Check className="w-3 h-3" />}
                    </div>
                    <span>Address Change</span>
                  </label>

                  <label
                    onClick={() => setIsRelationChange(!isRelationChange)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none text-xs font-bold ${
                      isRelationChange ? 'bg-amber-100 border-amber-500 text-amber-950' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRelationChange ? 'bg-amber-600 text-white' : 'bg-white'}`}>
                      {isRelationChange && <Check className="w-3 h-3" />}
                    </div>
                    <span>S/O, D/O, W/O</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              अतिरिक्त विवरण / टिप्पणी (वैकल्पिक)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="जैसे: पर्ची ले ली गई"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'टोकन जारी हो रहा है...' : 'टोकन जारी करें & सेव करें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
