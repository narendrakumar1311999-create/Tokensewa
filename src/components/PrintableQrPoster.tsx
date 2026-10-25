import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Sparkles,
  QrCode,
  Smartphone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Flame,
  ExternalLink,
  IndianRupee,
  Headphones,
  FileCheck2
} from 'lucide-react';

interface PrintableQrPosterProps {
  centerName?: string;
  centerAddress?: string;
}

export const PrintableQrPoster: React.FC<PrintableQrPosterProps> = ({
  centerName = 'ऑनलाइन फ्री टोकन सेवा (Online Free Token Seva)',
  centerAddress = 'गौर मिर्ज़ामुराद थाना के पीछे 221307',
}) => {
  const [qr1Url, setQr1Url] = useState<string>(''); // Simple direct QR
  const [qr2Url, setQr2Url] = useState<string>(''); // Full portal QR (Normal + Emergency)
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const simpleUrl = `${currentOrigin}/?mode=simple&qr=1`;
  const portalUrl = `${currentOrigin}/?mode=portal&qr=1`;

  useEffect(() => {
    if (currentOrigin) {
      // 1. Generate QR 1: Simple 1-Click
      QRCode.toDataURL(simpleUrl, {
        width: 480,
        margin: 1,
        color: {
          dark: '#065f46', // Emerald dark
          light: '#ffffff',
        },
      })
        .then((url) => setQr1Url(url))
        .catch((err) => console.error('Failed to generate QR 1:', err));

      // 2. Generate QR 2: Portal (Normal + Emergency)
      QRCode.toDataURL(portalUrl, {
        width: 480,
        margin: 1,
        color: {
          dark: '#1e1b4b', // Indigo dark
          light: '#ffffff',
        },
      })
        .then((url) => setQr2Url(url))
        .catch((err) => console.error('Failed to generate QR 2:', err));
    }
  }, [currentOrigin, simpleUrl, portalUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink1 = () => {
    navigator.clipboard.writeText(simpleUrl);
    setCopied1(true);
    setTimeout(() => setCopied1(false), 2000);
  };

  const handleCopyLink2 = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 mb-1">
            <QrCode className="w-4 h-4 text-indigo-600" />
            2-QR कोड काउंटर पोस्टर (Dual QR Poster)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            दुकान / काउंटर QR पोस्टर (Printable Standee Poster)
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            QR 1 सरल व सीधे बुकिंग हेतु एवं QR 2 सामान्य व इमरजेंसी अपॉइंटमेंट हेतु। इसे A4 साइज में प्रिंट करके लगाएं।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyLink1}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition cursor-pointer"
          >
            {copied1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied1 ? 'QR 1 लिंक कॉपी!' : 'QR 1 (सरल) लिंक'}
          </button>

          <button
            onClick={handleCopyLink2}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition cursor-pointer"
          >
            {copied2 ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied2 ? 'QR 2 लिंक कॉपी!' : 'QR 2 (पोर्टल) लिंक'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            पोस्टर प्रिंट करें (Print A4 Poster)
          </button>
        </div>
      </div>

      {/* Printable Poster Canvas */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border-4 border-indigo-950 p-6 sm:p-10 text-center text-slate-900 relative overflow-hidden print:border-2 print:shadow-none print:p-4 print:m-0 print:max-w-none">
        {/* Decorative Top Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-11 h-11 rounded-2xl bg-indigo-950 text-white font-black flex items-center justify-center text-lg">
              UID
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold tracking-widest text-indigo-700">डिजिटल टोकन सेवा</p>
              <p className="text-xs text-slate-500 font-bold">Aadhaar & Digital Citizen Queue</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block bg-emerald-100 text-emerald-950 font-black text-xs px-3.5 py-1 rounded-full border border-emerald-300">
              ⚡ स्वचालित 10 मिनट टाइम स्लॉट
            </span>
          </div>
        </div>

        {/* Center Name & Address */}
        <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
          {centerName}
        </h1>
        <p className="text-slate-600 text-xs sm:text-base font-semibold mt-1">
          {centerAddress}
        </p>

        {/* Operating Hours Banner */}
        <div className="my-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-950 px-4 py-1.5 rounded-2xl font-bold text-xs sm:text-sm">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>टोकन समय: <strong>सुबह 9:00 बजे से शाम 4:00 बजे तक</strong> (10-10 मिनट का समय)</span>
        </div>

        {/* Big Callout Box */}
        <div className="my-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-3 px-6 rounded-2xl font-black text-base sm:text-xl shadow-md">
          👇 लाइन में न लगें! अपनी सुविधानुसार नीचे दिए गए QR कोड को स्कैन करें 👇
          <span className="block text-xs font-normal text-indigo-200 mt-0.5">
            (Scan using Mobile Camera, Google Lens, Google Pay, PhonePe or Paytm)
          </span>
        </div>

        {/* DUAL QR CODES DISPLAY (2 QR CODES SIDE-BY-SIDE AS REQUESTED) */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* QR CODE 1: DIRECT SIMPLE APPOINTMENT */}
          <div className="p-5 sm:p-6 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 border-3 border-emerald-500 rounded-3xl shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white uppercase flex items-center gap-1 shadow-xs">
                  <Zap className="w-3.5 h-3.5" />
                  QR कोड 1: सरल बुकिंग
                </span>
                <span className="text-[11px] font-bold text-emerald-800">स्वतः समय</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                ⚡ 1-क्लिक सरल अपॉइंटमेंट
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                सिर्फ <strong>नाम, मोबाइल नंबर और काम</strong> चुनें — तारीख व समय अपने आप मिलेगा!
              </p>

              {/* QR Image */}
              <div className="my-4 text-center">
                <div className="inline-block p-3 bg-white rounded-2xl border-2 border-emerald-400 shadow-md">
                  {qr1Url ? (
                    <img
                      src={qr1Url}
                      alt="QR 1 - Simple Booking"
                      className="w-44 h-44 sm:w-48 sm:h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                      QR कोड लोड हो रहा है...
                    </div>
                  )}
                </div>
              </div>

              {/* Bullets */}
              <div className="space-y-1.5 text-xs font-bold text-emerald-950">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>सिर्फ 3 आसान विवरण</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>समय व तारीख अपने आप निर्धारित</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>तुरंत व्हाट्सएप पर्ची व 10 मिनट पूर्व अलर्ट</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200 no-print flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-mono text-[11px] truncate">/?mode=simple</span>
              <a
                href={simpleUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>खोलें</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* QR CODE 2: NORMAL & EMERGENCY APPOINTMENT PORTAL */}
          <div className="p-5 sm:p-6 bg-gradient-to-b from-indigo-50/70 via-white to-rose-50/30 border-3 border-indigo-600 rounded-3xl shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-700 text-white uppercase flex items-center gap-1 shadow-xs">
                  <Flame className="w-3.5 h-3.5" />
                  QR कोड 2: सामान्य व इमरजेंसी
                </span>
                <span className="text-[11px] font-bold text-indigo-900">विस्तृत पोर्टल</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                📋 सामान्य एवं इमरजेंसी पोर्टल
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                सामान्य बुकिंग या <strong>इमरजेंसी अपॉइंटमेंट (निःशुल्क - वास्तविक कारण)</strong>, समय स्लॉट, हेल्प डेस्क व नियम!
              </p>

              {/* QR Image */}
              <div className="my-4 text-center">
                <div className="inline-block p-3 bg-white rounded-2xl border-2 border-indigo-500 shadow-md">
                  {qr2Url ? (
                    <img
                      src={qr2Url}
                      alt="QR 2 - Normal and Emergency Portal"
                      className="w-44 h-44 sm:w-48 sm:h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                      QR कोड लोड हो रहा है...
                    </div>
                  )}
                </div>
              </div>

              {/* Bullets */}
              <div className="space-y-1.5 text-xs font-bold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>सामान्य अपॉइंटमेंट (पसंदीदा समय स्लॉट)</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-800">
                  <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>इमरजेंसी अपॉइंटमेंट (निःशुल्क - वास्तविक कारण आवश्यक)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>हेल्प डेस्क व नियम एवं शर्तें उपलब्ध</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-200 no-print flex items-center justify-between text-xs">
              <span className="text-indigo-800 font-mono text-[11px] truncate">/?mode=portal</span>
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
              >
                <span>खोलें</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Checklist for Center */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-indigo-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            1. मोबाइल नंबर अपडेट
          </span>
          <span className="flex items-center gap-1.5 text-indigo-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            2. बायोमेट्रिक अपडेट
          </span>
          <span className="flex items-center gap-1.5 text-indigo-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            3. नया इनरोलमेंट (New Aadhaar)
          </span>
          <span className="flex items-center gap-1.5 text-indigo-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            4. आधार सुधार (पता, पिता/पति नाम)
          </span>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-[11px] text-slate-500 font-semibold space-y-0.5">
          <p>नोट: बिना टोकन किसी का कार्य नहीं किया जाएगा। कृपया अपने टोकन समय से 10 मिनट पूर्व केंद्र पर उपस्थित रहें।</p>
          <p className="text-slate-600 font-bold">इमरजेंसी सेवा पर ₹50 अतिरिक्त शुल्क देय होगा • Consultant charges applicable</p>
        </div>
      </div>
    </div>
  );
};
