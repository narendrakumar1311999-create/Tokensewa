import React from 'react';
import {
  X,
  FileCheck2,
  AlertCircle,
  Clock,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              नियम एवं शर्तें (Terms & Conditions)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              टोकन बुकिंग, इमरजेंसी सेवा शुल्क व केंद्र दिशानिर्देश
            </p>
          </div>
        </div>

        {/* Highlight Callouts: Free Emergency with Real Purpose & Consultant Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>इमरजेंसी सेवा: 100% निःशुल्क</span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed font-semibold">
              'इमरजेंसी अपॉइंटमेंट' पूर्णतः <strong>निःशुल्क (Free)</strong> है। इसके लिए कोई अतिरिक्त शुल्क नहीं है, परन्तु आपका कारण वास्तविक (Real Purpose - चिकित्सा, यात्रा, परीक्षा) होना आवश्यक है।
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Consultant Charges Applicable</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
              केंद्र पर दस्तावेज सत्यापन, ऑनलाइन फॉर्म प्रोसेसिंग व तकनीकी सहायता हेतु <strong>Consultant charges applicable (कंसल्टेंट शुल्क लागू)</strong> हैं।
            </p>
          </div>
        </div>

        {/* Key Rules List */}
        <div className="space-y-3.5 text-xs text-slate-700">
          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-900">1. 10 मिनट पहले उपस्थित रहें</p>
              <p className="text-slate-600 mt-0.5">
                कृपया अपने निर्धारित टोकन समय से <strong>10 मिनट पहले</strong> केंद्र पर अनिवार्य रूप से उपस्थित रहें। टोकन का समय निकलने पर नया टोकन लेना पड़ सकता है।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-900">2. मूल दस्तावेज (Original Documents) अनिवार्य</p>
              <p className="text-slate-600 mt-0.5">
                आधार संशोधन, जन्म प्रमाण पत्र, पहचान पत्र या पते के मूल दस्तावेज ही मान्य होंगे। फोटोकॉपी पर कार्य नहीं किया जाएगा।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-900">3. टोकन व्यक्तिगत एवं अहस्तांतरणीय है</p>
              <p className="text-slate-600 mt-0.5">
                टोकन केवल उसी व्यक्ति के लिए मान्य है जिसके नाम व मोबाइल नंबर से जनरेट हुआ है। इसे अन्य किसी व्यक्ति को स्थानांतरित नहीं किया जा सकता।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-900">4. सर्वर एरर एवं तकनीकी रुकावट नीति</p>
              <p className="text-slate-600 mt-0.5">
                UIDAI के केंद्रीय सर्वर में रुकावट आने पर टोकन का समय स्वतः 15 से 45 मिनट आगे बढ़ाया जा सकता है या अगले कार्यदिवस के लिए शिफ्ट किया जा सकता है।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-900">5. सूचना एवं एसएमएस/व्हाट्सएप अलर्ट</p>
              <p className="text-slate-600 mt-0.5">
                टोकन बनते ही आपके व्हाट्सएप पर विवरण भेजा जाता है और ब्राउज़र में 10 मिनट पहले पुश नोटिफिकेशन अलर्ट प्राप्त होता है।
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <IndianRupee className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">6. Consultant charges applicable (परामर्श एवं सेवा शुल्क)</p>
              <p className="text-amber-900 mt-0.5">
                सेवा केंद्र पर फॉर्म भरने, पोर्टल सबमिशन, स्कैनिंग, एवं तकनीकी परामर्श हेतु <strong>Consultant charges applicable</strong> रहेंगे।
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            मैंने नियम पढ़ लिए हैं (Agree & Close)
          </button>
        </div>
      </div>
    </div>
  );
};
