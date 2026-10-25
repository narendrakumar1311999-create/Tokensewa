import React from 'react';
import {
  X,
  Headphones,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  Info,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface HelpDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerName?: string;
  centerAddress?: string;
}

export const HelpDeskModal: React.FC<HelpDeskModalProps> = ({
  isOpen,
  onClose,
  centerName = 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  centerAddress = 'गौर मिर्ज़ामुराद थाना के पीछे 221307',
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              हेल्प डेस्क एवं सहायता केंद्र
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              टोकन, आवश्यक दस्तावेज एवं ऑपरेटर सहायता
            </p>
          </div>
        </div>

        {/* Center Details & Quick Contact */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 mb-6">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">केंद्र का नाम व पता</p>
              <h4 className="text-sm font-extrabold text-slate-900">{centerName}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{centerAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-indigo-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-indigo-100">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>समय: सुबह 10:00 - शाम 4:00</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-indigo-100">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>UIDAI अधिकृत केंद्र</span>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href="tel:1947"
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              UIDAI 1947 कॉल
            </a>

            <a
              href="https://wa.me/?text=नमस्ते,%20मुझे%20आधार%20सेवा%20केंद्र%20के%20टोकन%20व%20दस्तावेज%20के%20बारे%20में%20जानकारी%20चाहिए।"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp सहायता
            </a>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
            <FileText className="w-4 h-4 text-indigo-600" />
            आवश्यक दस्तावेजों की सूची (Required Documents)
          </div>

          <div className="space-y-3 text-xs">
            {/* 1. Mobile Update */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                1. मोबाइल नंबर लिंक / अपडेट
              </p>
              <p className="text-slate-600 pl-5">
                मूल आधार कार्ड अनिवार्य है। किसी अन्य दस्तावेज की आवश्यकता नहीं होती। फिंगरप्रिंट या OTP द्वारा सत्यापन होगा।
              </p>
            </div>

            {/* 2. Biometric Update */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                2. बायोमेट्रिक अपडेट (फिंगरप्रिंट / फोटो / आंख)
              </p>
              <p className="text-slate-600 pl-5">
                मूल आधार कार्ड। 5 और 15 वर्ष की आयु पूर्ण करने वाले बच्चों का अनिवार्य बायोमेट्रिक अपडेट।
              </p>
            </div>

            {/* 3. New Enrollment */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                3. नया आधार कार्ड इनरोलमेंट
              </p>
              <p className="text-slate-600 pl-5">
                जन्म प्रमाण पत्र (Birth Certificate) एवं माता या पिता का आधार कार्ड।
              </p>
            </div>

            {/* 4. Correction */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                4. आधार सुधार (पता / पिता / पति का नाम)
              </p>
              <p className="text-slate-600 pl-5">
                <strong>पता सुधार:</strong> बिजली बिल, राशन कार्ड, बैंक पासबुक या मानक आधार सुधार फॉर्म।<br />
                <strong>पिता / पति नाम:</strong> मूल निवास, विवाह प्रमाण पत्र, या पहचान दस्तावेज।
              </p>
            </div>
          </div>
        </div>

        {/* Center Holidays & Working Days Notice */}
        <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-950 font-medium">
          <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-rose-900">
              🚫 रविवार एवं डाकघर अवकाश: केंद्र पूर्णतः बंद रहता है
            </p>
            <p className="text-[11px] text-rose-800 mt-0.5">
              केंद्र सोमवार से शनिवार सुबह 9:00 बजे से शाम 4:00 बजे तक खुला रहता है। रविवार और सरकारी डाकघर अवकाश पर टोकन बुकिंग बंद रहती है।
            </p>
          </div>
        </div>

        {/* Common Problems & Solutions (सामान्य समस्याएं एवं समाधान) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
            <Info className="w-4 h-4 text-indigo-600" />
            सामान्य समस्याएं एवं समाधान (FAQ & Solutions)
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900">
                Q1: क्या रविवार को आधार केंद्र पर काम होगा?
              </p>
              <p className="text-slate-600">
                <strong>उत्तर:</strong> नहीं, रविवार को डाकघर व आधार केंद्र पूर्णतः बंद रहता है। कृपया सोमवार से शनिवार के कार्यदिवस में आएं।
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900">
                Q2: क्या टोकन लेने के बाद धूप या भीड़ में खड़े रहना पड़ेगा?
              </p>
              <p className="text-slate-600">
                <strong>उत्तर:</strong> नहीं! आपके मोबाइल पर लाइव उलटी गिनती (Countdown Timer) चलती है और आपकी बारी से 10 मिनट पहले व्हाट्सएप अलर्ट आता है। आप समय होने पर ही काउंटर पर आएं।
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900">
                Q3: क्या कंसल्टेंट शुल्क लागू है?
              </p>
              <p className="text-slate-600">
                <strong>उत्तर:</strong> हाँ, केंद्र के तकनीकी ऑपरेटर व डिजिटल परामर्श सहायता हेतु नियमानुसार Consultant charges applicable होते हैं।
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900">
                Q4: यदि मुझे ट्रेन पकड़नी हो या तत्काल जल्दी काम कराना हो?
              </p>
              <p className="text-slate-600">
                <strong>उत्तर:</strong> इमरजेंसी सेवा <strong>पूर्णतः निःशुल्क (Free)</strong> है। यदि आपके पास यात्रा, चिकित्सा या तत्काल सरकारी कार्य का कोई वास्तविक कारण (Real Purpose) है, तो आपको बिना किसी अतिरिक्त शुल्क के प्राथमिकता दी जाएगी।
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="font-extrabold text-slate-900">
                Q5: यदि मेरा समय छूट जाए या मैं लेट हो जाऊं?
              </p>
              <p className="text-slate-600">
                <strong>उत्तर:</strong> ऑपरेटर द्वारा अनुपस्थित होने पर आप काउंटर ऑपरेटर से मिलकर अगले उपलब्ध स्लॉट में पुनः नंबर ले सकते हैं या ऐप से नया टोकन ले सकते हैं।
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="mt-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>इमरजेंसी अपॉइंटमेंट सूचना (100% Free):</strong> इमरजेंसी सेवा के लिए कोई शुल्क नहीं है। यदि आपके पास तत्काल यात्रा, मेडिकल या परीक्षा का वास्तविक कारण (Real Purpose) है, तो आप इमरजेंसी टोकन ले सकते हैं।
          </span>
        </div>

        {/* Official UIDAI External Links */}
        <div className="mt-4 space-y-2.5">
          {/* Regional Office Varanasi Lahartara Official Portal Link */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🏛️ क्षेत्रीय कार्यालय वाराणसी (लहरतारा) - Book Appointment</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                UIDAI के आधार सेवा केंद्र (ASK) लहरतारा, वाराणसी हेतु आधिकारिक पोर्टल पर अपॉइंटमेंट बुक करें।
              </p>
            </div>
            <a
              href="https://bookappointment.uidai.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shrink-0 shadow-xs cursor-pointer"
            >
              <span>Book Appointment</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Check Aadhaar Update Status Link */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🔍 आधार अपडेट स्थिति जांचें (Check Aadhaar Status)</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                UIDAI के आधिकारिक पोर्टल पर अपनी एनरोलमेंट ID (EID) से स्थिति चेक करें।
              </p>
            </div>
            <a
              href="https://myaadhaar.uidai.gov.in/CheckAadhaarStatus/en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shrink-0 shadow-xs cursor-pointer"
            >
              <span>Check Status</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            समझ गया (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
