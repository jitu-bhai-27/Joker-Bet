import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Send,
  Smartphone,
  Share2,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  FileCode,
  Globe,
  Sparkles,
  QrCode,
  Laptop,
} from 'lucide-react';

export const DistributionScreen: React.FC = () => {
  const { config, setCurrentScreen } = useApp();
  const [copied, setCopied] = useState(false);

  const websiteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jokerbet.pro';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-4 bg-[#07090e] text-slate-100 select-none pb-12 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        {/* Back Button */}
        <button
          onClick={() => setCurrentScreen('LOBBY')}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 mb-4 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Game Lobby</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-600 mx-auto flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-3">
            🃏
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>CLOUD WEB PLATFORM • ZERO INSTALLATION NEEDED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cinzel'] tracking-wide">
            Play Directly in Any Browser
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
            Joker Bet runs instantly on any smartphone, tablet, or desktop computer. No APK download, no installation errors, no device storage consumed!
          </p>
        </div>

        {/* Main Access Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: One-Tap Mobile PWA & Instant Web Access */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-amber-500/30 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-300 font-['Cinzel']">
                      Mobile Friendly Everywhere
                    </h3>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Android (Chrome) • iOS (Safari) • Windows • Mac
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  100% RESPONSIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070a12] border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Load:</strong> Zero waiting for downloads or system permissions.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Home Screen App Icon:</strong> Add to your phone home screen for full-screen immersive play without address bars.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Anti-DDoS Cloud Protected:</strong> High availability server clusters engineered for 1,000 to 10,000 concurrent players.
                  </span>
                </div>
              </div>
            </div>

            {/* PWA Install Trigger */}
            <div className="pt-2">
              <PWAInstallButton />
            </div>
          </div>

          {/* Card 2: QR Code & Direct Mobile Link */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-purple-300 font-['Cinzel']">
                      Open on Your Phone
                    </h3>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Scan or share website link
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  SCAN TO PLAY
                </span>
              </div>

              {/* QR Image Generator for current URL */}
              <div className="flex items-center gap-4 bg-[#070a12] p-3 rounded-xl border border-slate-800">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(websiteUrl)}`}
                  alt="Scan URL QR"
                  className="w-20 h-20 rounded-lg bg-white p-1 border border-slate-700 shrink-0"
                />
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white">Scan with Camera</div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Point your phone camera at this QR code to open Joker Bet instantly in mobile view.
                  </p>
                </div>
              </div>
            </div>

            {/* Copyable Web URL Box */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Direct Web Address:</span>
                {copied && <span className="text-emerald-400 font-bold">Copied!</span>}
              </div>
              <div className="flex items-center justify-between gap-2 bg-[#070a12] p-2 rounded-xl border border-slate-700">
                <span className="font-mono text-[10px] text-slate-300 truncate select-all">
                  {websiteUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 transition-all shadow-md"
                >
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram & Full Source Code Download Card */}
        <div className="p-4 rounded-2xl bg-[#0c121e] border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white shrink-0 shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-sky-300">Official Telegram Community</div>
              <div className="text-xs text-slate-400">
                Get real-time announcements, jackpot highlights, and 24/7 direct operator support.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={config?.telegramChannelUrl || 'https://t.me/JokerBetOfficial'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#229ED9] hover:bg-[#1e8ec4] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Join Channel</span>
            </a>

            <a
              href="/jokerbet-source-code.zip"
              download="jokerbet-full-source-code.zip"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2"
              title="Download Full Project Source Code Archive"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Download Source .ZIP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
