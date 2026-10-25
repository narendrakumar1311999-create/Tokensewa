import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  ShieldAlert,
  Crown,
  Briefcase,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { StaffUser } from '../types';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
  currentUser: StaffUser;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  authToken,
  currentUser,
}) => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state to add new staff/owner
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'owner' | 'staff'>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/staff', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStaffList(data.staff || []);
      } else {
        setError(data.error || 'स्टाफ सूची लोड करने में असमर्थ।');
      }
    } catch (err: any) {
      setError(err.message || 'नेटवर्क समस्या');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      fetchStaff();
    }
  }, [isOpen, authToken]);

  if (!isOpen) return null;

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !pin.trim()) {
      setError('कृपया नाम एवं 4 अंकों का पिन भरें।');
      return;
    }

    if (pin.trim().length < 4) {
      setError('पिन कम से कम 4 अंकों का होना चाहिए।');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim() || name.trim().toLowerCase().replace(/\s+/g, ''),
          pin: pin.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'सदस्य जोड़ने में त्रुटि।');
      }

      setSuccessMsg(data.message || 'नया सदस्य सफलतापूर्वक जोड़ा गया!');
      setName('');
      setUsername('');
      setPin('');
      setRole('staff');
      setShowAddForm(false);
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRole = async (targetUser: StaffUser) => {
    setError('');
    setSuccessMsg('');
    const newRole = targetUser.role === 'owner' ? 'staff' : 'owner';
    try {
      const res = await fetch(`/api/staff/${targetUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'पद बदलने में विफलता।');
      }

      setSuccessMsg(`${targetUser.name} का पद बदलकर ${newRole.toUpperCase()} कर दिया गया।`);
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई।');
    }
  };

  const handleDeleteStaff = async (targetUser: StaffUser) => {
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/staff/${targetUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'हटाने में विफलता।');
      }

      setSuccessMsg('सदस्य को हटा दिया गया।');
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              स्टाफ एवं ओनर प्रबंधन (Staff & Owner Management)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              एडमिन किसी भी व्यक्ति को स्टाफ या संचालक (Owner) बना सकता है।
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action button to reveal add form */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            सक्रिय सदस्य सूची ({staffList.length})
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            {showAddForm ? 'फॉर्म बंद करें' : '+ नया स्टाफ / ओनर बनाएं'}
          </button>
        </div>

        {/* Add New Staff/Owner Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddStaff}
            className="mb-6 p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3.5 animate-in fade-in"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-indigo-200 text-xs font-black text-indigo-950 uppercase tracking-wider">
              <Plus className="w-4 h-4 text-indigo-600" />
              नया सदस्य बनाएं (Assign Staff or Owner)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पूरा नाम *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. महेश शर्मा"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  यूज़रनेम (लॉगिन हेतु)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="उदा. mahesh (वैकल्पिक)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पद / रोल चुनें *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="staff">👔 स्टाफ (Staff - केवल कॉलिंग व डेटा देखना)</option>
                  <option value="owner">👑 संचालक (Owner - पूर्ण अधिकार व डिलीट)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4-अंकों का लॉगिन पिन *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="उदा. 4321"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-widest"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'जोड़ा जा रहा है...' : 'सदस्य सुरक्षित करें'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Staff / Owners List */}
        <div className="space-y-2.5">
          {staffList.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.role === 'owner'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  {item.role === 'owner' ? (
                    <Crown className="w-5 h-5" />
                  ) : (
                    <Briefcase className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {item.name}
                    </span>
                    {item.id === currentUser.id && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                        (आप स्वयं)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    यूज़र: <strong>{item.username}</strong> • पिन: <strong>{item.pin}</strong>
                  </p>
                </div>
              </div>

              {/* Action buttons to change role / delete */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRole(item)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                    item.role === 'owner'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                  }`}
                  title="रोल बदलें (Switch between Owner and Staff)"
                >
                  {item.role === 'owner' ? '👑 Owner है (स्टाफ बनाएं)' : '👔 Staff है (Owner बनाएं)'}
                </button>

                {item.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteStaff(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="हटाएं (Remove)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Roles explain note */}
        <div className="mt-6 p-3.5 bg-slate-100 rounded-2xl text-[11px] text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">अधिकार विवरण (Role Permissions):</p>
          <p>
            • <strong>👑 संचालक (Owner):</strong> पूरा नियंत्रण, किसी का भी टोकन डिलीट करना, सेटिंग्स बदलना, नया स्टाफ/ओनर बनाना।
          </p>
          <p>
            • <strong>👔 स्टाफ (Staff):</strong> टोकन बुलाना (कॉलिंग), कार्य पूर्ण मार्क करना, डेटा शीट देखना (टोकन डिलीट या सेटिंग्स बदलने की अनुमति नहीं)।
          </p>
          <p>
            • <strong>👤 ग्राहक (QR Customer):</strong> केवल अपॉइंटमेंट बुक करना व अपनी पर्ची/कतार देखना (डिलीट या ऐप में छेड़छाड़ का कोई विकल्प नहीं)।
          </p>
        </div>
      </div>
    </div>
  );
};
