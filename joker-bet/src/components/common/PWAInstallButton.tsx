import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share2, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running in standalone mode on Android/iOS, show small verified badge
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
        <CheckCircle2 className="w-3 h-3" />
        <span>Installed App</span>
      </div>
    );
  }

  // Android Chrome WebAPK flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 font-bold rounded-xl transition-all shadow-md ${
          compact
            ? 'px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs'
            : 'w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs uppercase tracking-wide'
        }`}
      >
        <Download className="w-4 h-4 text-black" />
        <span>Install App on Android</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className={`flex items-center gap-1.5 font-bold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all ${
            compact ? 'px-2.5 py-1 text-xs' : 'w-full py-3 text-xs uppercase'
          }`}
        >
          <Share2 className="w-4 h-4 text-sky-400" />
          <span>Install on iPhone</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#0d121c] border border-slate-700 p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Install on iPhone / iPad</span>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2 bg-[#070a12] p-3 rounded-xl border border-slate-800 leading-relaxed">
                <p>
                  1. Tap the <strong className="text-white">Share</strong> icon at the bottom of Safari <span className="text-sky-400 font-bold">[↑]</span>.
                </p>
                <p>
                  2. Scroll down and tap <strong className="text-white">&apos;Add to Home Screen&apos;</strong>.
                </p>
                <p>
                  3. Tap <strong className="text-amber-400">Add</strong> at the top right.
                </p>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button for desktop or non-Chromium browsers
  return (
    <button
      onClick={() => {
        alert(
          'To install this app on your phone:\n1. Open this link on your phone in Google Chrome (Android) or Safari (iPhone)\n2. Tap "Install App" or "Add to Home Screen"'
        );
      }}
      className={`flex items-center gap-1.5 font-bold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all ${
        compact ? 'px-2.5 py-1 text-xs' : 'w-full py-3 text-xs uppercase'
      }`}
    >
      <Download className="w-4 h-4 text-emerald-400" />
      <span>Install App on Mobile</span>
    </button>
  );
};
