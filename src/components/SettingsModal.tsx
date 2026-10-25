import React, { useState } from 'react';
import { X, Settings, Clock, Building2, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onResetTokens: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  onSave,
  onResetTokens,
}) => {
  const [formData, setFormData] = useState<AppSettings>(initialSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
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

        <div className="mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            केंद्र सेटिंग्स (Center & Slot Settings)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            दुकान का नाम, समय (9:00 AM से 4:00 PM) एवं 10 मिनट स्लॉट विन्यास।
          </p>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            सेटिंग्स सफलतापूर्वक सहेज ली गईं!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              दुकान / केंद्र का नाम (Center Name)
            </label>
            <input
              type="text"
              required
              value={formData.centerName}
              onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              पता / लैंडमार्क (Address & Location)
            </label>
            <input
              type="text"
              value={formData.centerAddress}
              onChange={(e) => setFormData({ ...formData, centerAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                शुरू समय (Start Hour)
              </label>
              <select
                value={formData.startHour}
                onChange={(e) => setFormData({ ...formData, startHour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={8}>08:00 AM</option>
                <option value={9}>09:00 AM (डिफ़ॉल्ट)</option>
                <option value={10}>10:00 AM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                समाप्ति समय (Closing Hour)
              </label>
              <select
                value={formData.endHour}
                onChange={(e) => setFormData({ ...formData, endHour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              >
                <option value={15}>03:00 PM</option>
                <option value={16}>04:00 PM (डिफ़ॉल्ट)</option>
                <option value={17}>05:00 PM</option>
                <option value={18}>06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              प्रति स्लॉट समय अंतराल (Minutes per Slot)
            </label>
            <select
              value={formData.slotIntervalMinutes}
              onChange={(e) =>
                setFormData({ ...formData, slotIntervalMinutes: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
            >
              <option value={5}>5 मिनट</option>
              <option value={10}>10 मिनट (निर्देशानुसार)</option>
              <option value={15}>15 मिनट</option>
              <option value={20}>20 मिनट</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoAnnounceVoice}
                onChange={(e) =>
                  setFormData({ ...formData, autoAnnounceVoice: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-700">
                टोकन बुलाने पर हिंदी में बोलकर पुकारें (Voice Announcement)
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {confirmReset ? (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-rose-700">निश्चित रीसेट करें?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetTokens();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition cursor-pointer"
                >
                  हाँ
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  रद्द
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                आज के टोकन रीसेट करें
              </button>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              सेटिंग्स सहेजें
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
