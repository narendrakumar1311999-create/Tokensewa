import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Volume2,
  Trash2,
  RefreshCw,
  Plus,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  XCircle,
  Check,
  CreditCard,
  CalendarClock,
  Server,
  AlertTriangle
} from 'lucide-react';
import { TokenRecord, TokenStatus, StaffUser } from '../types';
import { announceToken } from '../utils/audio';

interface DataSheetTableProps {
  tokens: TokenRecord[];
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: TokenStatus, counter?: number) => void;
  onDeleteToken: (id: string) => void;
  onOpenManualEntry: () => void;
  onOpenDisruptionModal?: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLoading?: boolean;
  currentUser: StaffUser | null;
  authToken?: string;
}

export const DataSheetTable: React.FC<DataSheetTableProps> = ({
  tokens,
  onRefresh,
  onUpdateStatus,
  onDeleteToken,
  onOpenManualEntry,
  onOpenDisruptionModal,
  selectedDate,
  onDateChange,
  isLoading = false,
  currentUser,
  authToken,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [callingId, setCallingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'shift_single' | 'shift_all' | 'delete';
    token?: TokenRecord;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Filter tokens
  const filteredTokens = tokens.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.mobile.includes(searchTerm) ||
      (t.aadhaar && t.aadhaar.includes(searchTerm)) ||
      t.tokenDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchService = serviceFilter === 'all' || t.service === serviceFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchSearch && matchService && matchStatus;
  });

  const handleCallToken = (token: TokenRecord) => {
    setCallingId(token.id);
    announceToken(token.tokenDisplay, 1, token.name);
    onUpdateStatus(token.id, 'called', 1);
    setTimeout(() => setCallingId(null), 1000);
  };

  const handleExportCsv = () => {
    window.location.href = `/api/tokens/export/csv?date=${selectedDate}`;
  };

  // Shift single token to tomorrow
  const executeShiftTokenTomorrow = async (token: TokenRecord) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/queue/shift-next-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tokenId: token.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setConfirmModal(null);
        onRefresh();
      } else {
        showToast(data.error || 'शिफ्ट करने में विफल', 'error');
      }
    } catch {
      showToast('त्रुटि हुई। कृपया पुनः प्रयास करें।', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Shift ALL remaining waiting/called tokens to tomorrow
  const executeShiftAllTomorrow = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/queue/shift-next-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fromDate: selectedDate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setConfirmModal(null);
        onRefresh();
      } else {
        showToast(data.error || 'शिफ्ट करने में विफल', 'error');
      }
    } catch {
      showToast('त्रुटि हुई। कृपया पुनः प्रयास करें।', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: TokenStatus) => {
    switch (status) {
      case 'called':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            बुलाया गया (Called)
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            जारी है (In Progress)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3.5 h-3.5" />
            पूर्ण (Done)
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            अनुपस्थित (Absent)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
            रद्द (Cancelled)
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            प्रतीक्षारत (Waiting)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              लाइव डेटा शीट (Auto-Saved Token Sheet)
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              ऑटो-सेव चालू है
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            प्रत्येक नया QR टोकन यहाँ स्वतः दर्ज हो जाता है। आप इसे सीधे Excel या Google Sheets में डाउनलोड कर सकते हैं।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenDisruptionModal && (
            <button
              onClick={onOpenDisruptionModal}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              title="सर्वर एरर / टाइम आगे बढ़ाएं"
            >
              <Server className="w-4 h-4" />
              सर्वर एरर / टाइम कंट्रोल
            </button>
          )}

          <button
            onClick={() => setConfirmModal({ type: 'shift_all' })}
            className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            title="आज के सभी शेष टोकन कल सुबह 9:00 AM से आगे शिफ्ट करें"
          >
            <CalendarClock className="w-4 h-4" />
            कल शिफ्ट करें (Shift Next Day)
          </button>

          <button
            onClick={onOpenManualEntry}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            मैन्युअल टोकन
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            title="Download CSV for Excel or Google Sheets"
          >
            <Download className="w-4 h-4" />
            Excel डाउनलोड
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="नाम, मोबाइल, आधार या ID खोजें..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Date Filter */}
        <div className="relative flex items-center">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
          />
        </div>

        {/* Service Filter */}
        <div>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">सभी सेवाएं (All Services)</option>
            <option value="mobile_update">1. मोबाइल नंबर अपडेट</option>
            <option value="biometric_update">2. बायोमेट्रिक अपडेट</option>
            <option value="new_enrollment">3. नया इनरोलमेंट</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">सभी स्थिति (All Status)</option>
            <option value="waiting">प्रतीक्षारत (Waiting)</option>
            <option value="called">बुलाया गया (Called)</option>
            <option value="in_progress">जारी है (In Progress)</option>
            <option value="completed">पूर्ण (Completed)</option>
            <option value="absent">अनुपस्थित (Absent)</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-bold">
                <th className="py-4 px-4 text-center">टोकन</th>
                <th className="py-4 px-4">यूनिक ID</th>
                <th className="py-4 px-4">ग्राहक का नाम</th>
                <th className="py-4 px-4">मोबाइल नं.</th>
                <th className="py-4 px-4">आधार नंबर</th>
                <th className="py-4 px-4">काम / सेवा</th>
                <th className="py-4 px-4">10 मिनट स्लॉट</th>
                <th className="py-4 px-4">स्थिति</th>
                <th className="py-4 px-4 text-right">कार्रवाई / एक्शन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-base text-slate-600">कोई टोकन रिकॉर्ड नहीं मिला</p>
                    <p className="text-xs text-slate-400 mt-1">
                      QR कोड स्कैन करवाकर या "मैन्युअल टोकन" बटन से नया टोकन दर्ज करें।
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      t.status === 'called' ? 'bg-amber-50/60 font-semibold' : ''
                    }`}
                  >
                    {/* Token Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-3 py-1 text-white font-black rounded-xl text-sm font-mono shadow-xs ${
                        t.isEmergency ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-indigo-900'
                      }`}>
                        {t.tokenDisplay}
                      </span>
                      {t.isEmergency && (
                        <span className="block text-[10px] font-black text-rose-600 mt-0.5 whitespace-nowrap">
                          🚨 इमरजेंसी (निःशुल्क - Real Purpose)
                        </span>
                      )}
                    </td>

                    {/* Unique ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 text-xs">
                      {t.uniqueId}
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {t.name}
                      {t.notes && (
                        <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">
                          {t.notes}
                        </span>
                      )}
                    </td>

                    {/* Mobile with WhatsApp & Call */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>+91 {t.mobile}</span>
                        <a
                          href={`https://wa.me/91${t.mobile}?text=${encodeURIComponent(
                            `नमस्ते ${t.name}, आपका टोकन ${t.tokenDisplay} (${t.serviceLabel}) का समय ${t.slotFullText} है।`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
                          title="WhatsApp संदेश भेजें"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <a
                          href={`tel:${t.mobile}`}
                          className="p-1 rounded-lg hover:bg-blue-100 text-blue-600 transition"
                          title="कॉल करें"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Aadhaar Number */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {t.aadhaar ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                          <CreditCard className="w-3 h-3 text-indigo-600" />
                          •••• {t.aadhaar.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Service */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
                        {t.serviceLabel}
                      </span>
                    </td>

                    {/* Time Slot (10-min interval) */}
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{t.slotFullText}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Call Voice announcement */}
                        <button
                          onClick={() => handleCallToken(t)}
                          disabled={callingId === t.id}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                          title="आवाज देकर बुलाएं (Speak & Call)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          बुलाएं
                        </button>

                        {/* Mark Completed */}
                        {t.status !== 'completed' && (
                          <button
                            onClick={() => onUpdateStatus(t.id, 'completed')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            title="कार्य पूर्ण करें (Mark Complete)"
                          >
                            <Check className="w-3.5 h-3.5" />
                            पूर्ण
                          </button>
                        )}

                        {/* Shift to Next Day */}
                        {t.status === 'waiting' && (
                          <button
                            onClick={() => setConfirmModal({ type: 'shift_single', token: t })}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                            title="कल के लिए शिफ्ट करें (Shift to Tomorrow)"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>
                        )}

                        {/* Mark Absent */}
                        {t.status !== 'completed' && t.status !== 'absent' && (
                          <button
                            onClick={() => onUpdateStatus(t.id, 'absent')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            title="अनुपस्थित मार्क करें (Skip/Absent)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Token - Only Owner has permission to delete! */}
                        {currentUser?.role === 'owner' && (
                          <button
                            onClick={() => setConfirmModal({ type: 'delete', token: t })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="हटाएं (केवल Owner को अनुमति)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            कुल <strong>{filteredTokens.length}</strong> टोकन रिकॉर्ड प्रदर्शित ({selectedDate})
          </span>
          <span className="font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            प्रत्येक एंट्री सर्वर डेटा शीट में स्वचालित रूप से सुरक्षित है।
          </span>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Safe In-App Confirmation Modal (Does not use browser window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {confirmModal.type === 'delete' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <CalendarClock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {confirmModal.type === 'shift_all' && 'आज के सभी टोकन कल शिफ्ट करें'}
                  {confirmModal.type === 'shift_single' && 'टोकन कल के लिए शिफ्ट करें'}
                  {confirmModal.type === 'delete' && 'टोकन हटाएं (Delete Token)'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {confirmModal.type === 'shift_all' && 'सर्वर एरर या काम रुकने पर अगला दिन'}
                  {confirmModal.type === 'shift_single' && 'अगले कार्यदिवस पर समय पुनः आवंटन'}
                  {confirmModal.type === 'delete' && 'स्थायी रूप से हटाना'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {confirmModal.type === 'shift_all' && (
                <>
                  क्या आप <strong>{selectedDate}</strong> के सभी प्रतीक्षारत ग्राहकों का समय स्वतः कल सुबह 9:00 AM से आगे स्थानांतरित करना चाहते हैं?
                </>
              )}
              {confirmModal.type === 'shift_single' && (
                <>
                  क्या आप <strong>{confirmModal.token?.tokenDisplay} ({confirmModal.token?.name})</strong> को कल सुबह 9:00 AM से आगे के उपलब्ध स्लॉट पर शिफ्ट करना चाहते हैं?
                </>
              )}
              {confirmModal.type === 'delete' && (
                <>
                  क्या आप वाकई <strong>{confirmModal.token?.tokenDisplay} ({confirmModal.token?.name})</strong> को कतार सूची से हटाना चाहते हैं?
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>

              {confirmModal.type === 'shift_all' && (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={executeShiftAllTomorrow}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isActionLoading ? 'शिफ्ट हो रहा है...' : 'हाँ, सभी कल शिफ्ट करें'}
                </button>
              )}

              {confirmModal.type === 'shift_single' && confirmModal.token && (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => executeShiftTokenTomorrow(confirmModal.token!)}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isActionLoading ? 'शिफ्ट हो रहा है...' : 'हाँ, कल शिफ्ट करें'}
                </button>
              )}

              {confirmModal.type === 'delete' && confirmModal.token && (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => {
                    onDeleteToken(confirmModal.token!.id);
                    setConfirmModal(null);
                    showToast(`${confirmModal.token!.tokenDisplay} हटा दिया गया`, 'success');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  हटाएं (Delete)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
