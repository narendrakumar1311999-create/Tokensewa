import React from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Flame,
  ArrowRight,
  Headphones,
  Info
} from 'lucide-react';

interface SelfBookingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBooking?: (mode: 'simple' | 'normal') => void;
}

export const SelfBookingGuideModal: React.FC<SelfBookingGuideModalProps> = ({
  isOpen,
  onClose,
  onStartBooking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Big Icon */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              आधिकारिक गाइड एवं नियम
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              खुद से अपॉइंटमेंट कैसे बुक करें?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
              4 आसान चरणों में अपना टोकन नंबर प्राप्त करें और बिना लाइन में लगे काम कराएं।
            </p>
          </div>
        </div>

        {/* 4 Large Visual Step Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            अपॉइंटमेंट बुकिंग के 4 आसान चरण (Step-by-Step Guide)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Step 1 */}
            <div className="p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl space-y-2 relative overflow-hidden group hover:border-indigo-300 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  1
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  पहला चरण
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                1. काम (Service) चुनें
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                मोबाइल नंबर लिंक/अपडेट, बायोमेट्रिक अपडेट, नया आधार कार्ड या पता/नाम सुधार में से अपनी आवश्यकता चुनें।
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl space-y-2 relative overflow-hidden group hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  2
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  दूसरा चरण
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                2. नाम, मोबाइल व 12-अंक आधार लिखें *
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                अपना पूरा नाम, 10-अंकों का मोबाइल और 12-अंकों का सही आधार नंबर भरें। <strong>नियम:</strong> 1 आधार नंबर से केवल 1 सक्रिय टोकन बुक हो सकता है।
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-slate-50 border-2 border-amber-100 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  3
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  तीसरा चरण
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                3. समय चुनें या 1-क्लिक सीधा टोकन
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                <strong>QR 1 (त्वरित सीधा टोकन):</strong> चालू लाइव समय से तुरंत 10-मिनट का अगला स्लॉट स्वतः मिल जाएगा।<br />
                <strong>विस्तृत बुकिंग:</strong> अपनी पसंद से दिन व खाली हरा स्लॉट चुनें।
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-slate-50 border-2 border-purple-100 rounded-2xl space-y-2 relative overflow-hidden group hover:border-purple-300 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  4
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  चौथा चरण
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                4. टोकन पर्ची व लाइव उलटी गिनती
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                स्क्रीन पर आपका टोकन नंबर (जैसे TK-05) और लाइव काउंटडाउन टाइमर शुरू हो जाएगा। धूप या भीड़ में खड़े रहने की जरूरत नहीं!
              </p>
            </div>
          </div>
        </div>

        {/* Working Days & Sunday Closed Rules */}
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
            <Calendar className="w-5 h-5 text-rose-600 shrink-0" />
            <span>केंद्र समय एवं रविवार / डाकघर अवकाश नियम (Important)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-rose-900 font-semibold">
            <div className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>कार्यदिवस: सोमवार से शनिवार (सुबह 10:00 - शाम 4:00)</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>रविवार: पूर्णतः बंद (Sunday Closed)</span>
            </div>
          </div>
          <p className="text-[11px] text-rose-800 font-medium">
            * रविवार और सरकारी डाकघर अवकाश के दिन आधार केंद्र बंद रहता है। उस दिन की बुकिंग स्वीकार नहीं की जाती।
          </p>
        </div>

        {/* Mandatory Customer Guidelines */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            ग्राहकों के लिए महत्वपूर्ण दिशानिर्देश (Guidelines)
          </h3>

          <div className="space-y-2 text-xs font-medium text-slate-700">
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <p>
                <strong>समय पर पहुंचें:</strong> अपने आवंटित 10-मिनट स्लॉट से 5 मिनट पूर्व आधार केंद्र पर उपस्थित रहें।
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <p>
                <strong>मूल दस्तावेज अनिवार्य:</strong> ओरिजिनल आधार कार्ड व प्रमाण पत्र (जन्म/राशन/बिजली बिल) साथ लेकर आएं।
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <p>
                <strong>Consultant charges applicable (कंसल्टेंट शुल्क लागू):</strong> नियमानुसार सरकारी व परामर्श सहायता शुल्क काउंटर पर देय होगा।
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                4
              </span>
              <p>
                <strong>🚨 इमरजेंसी तत्काल सेवा (निःशुल्क - Real Purpose):</strong> यदि तत्काल ट्रेन, अस्पताल, मेडिकल या परीक्षा का कार्य है तो इमरजेंसी विकल्प चुनें; यह सेवा पूर्णतः निःशुल्क (Free) है परन्तु कारण वास्तविक (Real Purpose) होना अनिवार्य है।
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-indigo-50 border border-indigo-300 rounded-xl text-indigo-950">
              <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                5
              </span>
              <p>
                <strong>1 आधार नंबर = केवल 1 टोकन (Mandatory Aadhaar Rule):</strong> बुकिंग के लिए 12 अंकों का आधार नंबर अनिवार्य है। एक आधार कार्ड पर एक समय में केवल एक ही सक्रिय टोकन मान्य होगा। जब तक वह पूरा या रद्द नहीं होता, दूसरा टोकन नहीं बनेगा।
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
          >
            बंद करें (Close)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onStartBooking && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onStartBooking('simple');
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ⚡ 1-क्लिक सीधा टोकन लें
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onStartBooking('normal');
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📅 विस्तृत अपॉइंटमेंट
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
