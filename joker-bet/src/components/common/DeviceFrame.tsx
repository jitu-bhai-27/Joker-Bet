import React, { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Smartphone,
  Tablet,
  Maximize2,
  ShieldAlert,
  DownloadCloud,
  Wifi,
  Battery,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const DeviceFrame: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    deviceMode,
    setDeviceMode,
    currentScreen,
    setCurrentScreen,
    sessionRevokedMessage,
    dismissSessionRevoked,
    maintenanceModalOpen,
    versionUpdateModalOpen,
    dismissVersionModal,
    config,
  } = useApp();

  return (
    <div className="min-h-screen bg-[#05070b] text-slate-100 flex flex-col items-center justify-start">
      {/* Top Universal Control Ribbon */}
      <header className="w-full bg-[#0a0d14] border-b border-amber-500/20 px-3 py-2 z-50 flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            🃏
          </div>
          <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent font-['Cinzel']">
            JOKER BET
          </span>
          <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            LIVE ENGINE
          </span>
        </div>

        {/* Device & Mode Selector (Only on desktop / tablet screens) */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#0f1420] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setDeviceMode('ANDROID')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
              deviceMode === 'ANDROID'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Preview as Android Native Phone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android</span>
          </button>

          <button
            onClick={() => setDeviceMode('IOS')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
              deviceMode === 'IOS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Preview as iPhone iOS Viewport"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">iOS</span>
          </button>

          <button
            onClick={() => setDeviceMode('RESPONSIVE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-medium ${
              deviceMode === 'RESPONSIVE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full-Width Responsive Web Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Web</span>
          </button>
        </div>

        {/* Global Navigation Shortcuts */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <PWAInstallButton compact={true} />

          <a
            href="/jokerbet-source-code.zip"
            download="jokerbet-full-source-code.zip"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 transition-all font-semibold"
            title="Download complete zip of all source code"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Source (.ZIP)</span>
          </a>

          <button
            onClick={() => setCurrentScreen('DISTRIBUTION')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all ${
              currentScreen === 'DISTRIBUTION'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>APK Info</span>
          </button>

          <button
            onClick={() => setCurrentScreen(currentScreen === 'ADMIN' ? 'LOBBY' : 'ADMIN')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all shadow-md ${
              currentScreen === 'ADMIN'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-gradient-to-r from-red-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{currentScreen === 'ADMIN' ? 'Exit Admin' : 'Admin'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-0 md:p-4 overflow-y-auto">
        {deviceMode === 'RESPONSIVE' || currentScreen === 'ADMIN' ? (
          <div className="w-full max-w-7xl min-h-[calc(100vh-65px)] bg-[#07090e] shadow-2xl relative">
            {children}
          </div>
        ) : (
          /* Mobile Framed Device (Desktop Preview Only) */
          <div className="w-full h-full md:max-w-[430px] md:h-[870px] md:max-h-[96vh] md:rounded-[42px] md:border-[10px] border-[#181b24] shadow-[0_0_60px_rgba(0,0,0,0.85)] bg-[#07090e] flex flex-col relative overflow-hidden">
            {/* Status Bar (Only visible on desktop emulator) */}
            <div className="hidden md:flex w-full h-8 bg-transparent px-6 items-center justify-between text-[11px] text-slate-400 select-none z-30 pt-1">
              <span className="font-semibold text-slate-200">9:41</span>

              {/* Dynamic Island for iOS or Pin-hole Camera for Android */}
              {deviceMode === 'IOS' ? (
                <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-slate-700/50" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-emerald-400">5G</span>
                <Wifi className="w-3 h-3 text-slate-300" />
                <Battery className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>

            {/* Framed Inner Screen */}
            <div className="flex-1 overflow-y-auto relative flex flex-col">{children}</div>

            {/* Bottom Home Indicator */}
            <div className="w-full h-4 bg-transparent flex items-center justify-center pb-1">
              <div className="w-28 h-1 bg-slate-600/40 rounded-full" />
            </div>
          </div>
        )}
      </main>

      {/* Un-dismissible Single Active Session Revocation Modal (Device A) */}
      {sessionRevokedMessage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d111a] border-2 border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-4 border border-red-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-['Cinzel']">Session Terminated</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {sessionRevokedMessage}
              <br />
              <span className="text-xs text-slate-400 mt-2 block">
                Joker Bet enforces strict single-active device security. Your previous connection has been safely closed.
              </span>
            </p>
            <button
              onClick={dismissSessionRevoked}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Log In Again
            </button>
          </div>
        </div>
      )}

      {/* Edge Case 7: Admin Maintenance Mode Hard Stop Overlay */}
      {maintenanceModalOpen && (
        <div className="fixed inset-0 z-[99] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0e121b] border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.25)]">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-4 border border-amber-500/30">
              <RotateCcw className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h2 className="text-2xl font-black text-amber-300 mb-2 font-['Cinzel']">
              Maintenance In Progress
            </h2>
            <p className="text-xs text-amber-200/80 mb-4 bg-amber-500/10 py-2 px-3 rounded-lg border border-amber-500/20">
              ⚡ 100% Automatic Refund Guarantee: All active games and waiting rooms have been cancelled and coins instantly refunded to player balances.
            </p>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Our engineering team is upgrading gateway liquidity and high-concurrency servers. Gameplay will resume automatically once complete.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentScreen('ADMIN')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700"
              >
                Admin Access
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold rounded-xl text-xs"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Update Modal */}
      {versionUpdateModalOpen && (
        <div className="fixed inset-0 z-[98] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d121c] border border-cyan-500/40 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(6,182,212,0.2)]">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-4 border border-cyan-500/30">
              <DownloadCloud className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 font-['Cinzel']">Update Required</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              A mandatory security update ({config?.minAppVersion || 'v1.0.4'}) is required to continue playing with real-time multi-device security.
            </p>
            <div className="space-y-2.5">
              <a
                href={config?.telegramChannelUrl || 'https://t.me/JokerBetOfficial'}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 bg-[#229ED9] hover:bg-[#1f8ec4] text-white font-bold rounded-xl shadow-lg transition-all text-sm"
              >
                Update via Telegram Channel
              </a>
              <a
                href={config?.apkDownloadUrl || '#'}
                download
                className="block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700"
              >
                Direct Download APK (~18 MB)
              </a>
              <button
                onClick={dismissVersionModal}
                className="text-xs text-slate-400 hover:text-slate-300 underline mt-2"
              >
                Continue in Browser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
