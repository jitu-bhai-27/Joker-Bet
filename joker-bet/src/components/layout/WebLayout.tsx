import React, { ReactNode, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  Plus,
  Shield,
  ShieldCheck,
  Lock,
  Headphones,
  Clock,
  Wallet,
  Menu,
  X,
  Trophy,
  ExternalLink,
  Activity,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const WebLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    currentScreen,
    setCurrentScreen,
    walletTab,
    setWalletTab,
    logout,
    sessionRevokedMessage,
    dismissSessionRevoked,
    maintenanceModalOpen,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/security/stats')
      .then((res) => res.json())
      .then((data) => setSecurityStatus(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Ticker Bar (Live Jackpot & Security Status) */}
      <div className="bg-[#090d16] border-b border-amber-500/20 text-xs px-3 sm:px-4 py-1.5 flex items-start sm:items-center justify-between gap-2 text-slate-400">
        <div className="min-w-0 flex items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-start sm:items-center gap-1.5 text-amber-300 font-bold font-mono leading-tight">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="hidden sm:inline">LIVE PLATFORM:</span>
            <span>1 Coin = ₹1.00 INR (1:1 Fixed Parity)</span>
          </div>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline text-[11px] text-slate-400">
            Certified Provably Fair RNG System Active
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1 text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anti-DDoS Shield:</span>
            <span>Active</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-bold">18+ ONLY</span>
        </div>
      </div>

      {/* Main Website Header Navbar */}
      <header className="sticky top-0 z-40 bg-[#080b13]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentScreen('LOBBY')}
            className="min-w-0 flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-[2px] shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0b0e17] rounded-[10px] flex items-center justify-center font-black text-amber-300 text-lg">
                🃏
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 bg-clip-text text-transparent font-['Cinzel'] whitespace-nowrap">
                  JOKER BET
                </span>
                <span className="hidden min-[390px]:inline text-[9px] uppercase tracking-widest px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight hidden sm:block">
                Real-Money 3-Card Multiplayer Arena
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
            <button
              onClick={() => setCurrentScreen('LOBBY')}
              className={`hover:text-amber-300 transition-colors ${
                currentScreen === 'LOBBY' || currentScreen === 'GAME' ? 'text-amber-400 font-black' : ''
              }`}
            >
              Live Tables
            </button>
            <button
              onClick={() => {
                setWalletTab('DEPOSIT');
                setCurrentScreen('WALLET');
              }}
              className={`hover:text-amber-300 transition-colors ${
                currentScreen === 'WALLET' && walletTab === 'DEPOSIT' ? 'text-amber-400 font-black' : ''
              }`}
            >
              Deposit Coins
            </button>
            <button
              onClick={() => {
                setWalletTab('WITHDRAWAL');
                setCurrentScreen('WALLET');
              }}
              className={`hover:text-amber-300 transition-colors ${
                currentScreen === 'WALLET' && walletTab === 'WITHDRAWAL' ? 'text-amber-400 font-black' : ''
              }`}
            >
              24h Withdrawals
            </button>
            <button
              onClick={() => setCurrentScreen('HISTORY')}
              className={`hover:text-amber-300 transition-colors ${
                currentScreen === 'HISTORY' ? 'text-amber-400 font-black' : ''
              }`}
            >
              Game History
            </button>
            <button
              onClick={() => setCurrentScreen('SUPPORT')}
              className={`hover:text-amber-300 transition-colors ${
                currentScreen === 'SUPPORT' ? 'text-amber-400 font-black' : ''
              }`}
            >
              Support Desk
            </button>
          </nav>

          {/* User Account / Balance / Auth Action */}
          <div className="shrink-0 flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Balance Pill */}
                <div
                  onClick={() => {
                    setWalletTab('DEPOSIT');
                    setCurrentScreen('WALLET');
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 bg-[#0d121c] border border-amber-500/40 rounded-full pl-2.5 sm:pl-3.5 pr-1.5 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer hover:border-amber-400 transition-all"
                  title="Click to Deposit Coins"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-200">
                      {user.coins.toLocaleString()}
                    </span>
                    <span className="hidden min-[390px]:inline text-[10px] text-slate-400 ml-1 font-semibold">Coins</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black flex items-center justify-center font-bold text-xs shadow-md">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Profile Pill & Logout (Desktop) */}
                <div className="hidden sm:flex items-center gap-2 pl-1">
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {user.username || '@player'}
                  </span>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCurrentScreen('AUTH')}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-[11px] sm:text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all whitespace-nowrap"
              >
                <span className="sm:hidden">Sign In</span>
                <span className="hidden sm:inline">Sign In / Register</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                setCurrentScreen('LOBBY');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0c101b] text-left text-xs font-bold text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Live 3-Card Tables</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => {
                setWalletTab('DEPOSIT');
                setCurrentScreen('WALLET');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0c101b] text-left text-xs font-bold text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Deposit Coins (Instant UPI)</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => {
                setWalletTab('WITHDRAWAL');
                setCurrentScreen('WALLET');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0c101b] text-left text-xs font-bold text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Withdraw Coins (24h Bank Transfer)</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => {
                setCurrentScreen('HISTORY');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0c101b] text-left text-xs font-bold text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Transaction & Round History</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => {
                setCurrentScreen('SUPPORT');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0c101b] text-left text-xs font-bold text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span>24/7 Operations Support Desk</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-red-400 rounded-xl bg-red-500/10 border border-red-500/30"
              >
                Sign Out ({user.username})
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Website Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (App-like mobile experience on any phone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080b13]/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-2 flex items-center justify-around text-[10px] font-bold select-none shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setCurrentScreen('LOBBY')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            currentScreen === 'LOBBY' || currentScreen === 'GAME'
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Tables</span>
        </button>

        <button
          onClick={() => {
            setWalletTab('DEPOSIT');
            setCurrentScreen('WALLET');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            currentScreen === 'WALLET' && walletTab === 'DEPOSIT'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Deposit</span>
        </button>

        <button
          onClick={() => {
            setWalletTab('WITHDRAWAL');
            setCurrentScreen('WALLET');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            currentScreen === 'WALLET' && walletTab === 'WITHDRAWAL'
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Withdraw</span>
        </button>

        <button
          onClick={() => setCurrentScreen('HISTORY')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            currentScreen === 'HISTORY'
              ? 'text-sky-400 bg-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>History</span>
        </button>

        <button
          onClick={() => setCurrentScreen('SUPPORT')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            currentScreen === 'SUPPORT'
              ? 'text-purple-400 bg-purple-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Support</span>
        </button>
      </div>

      {/* Website Footer (Statutory 18+, Fair Play, Security) */}
      <footer className="mt-auto bg-[#04060a] border-t border-slate-800/80 pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 mb-6 sm:mb-8">
          {/* Brand & Security */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-white font-['Cinzel'] text-sm">
              <span>🃏 JOKER BET</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                ENCRYPTED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              India&apos;s premier real-time 3-Card Joker table platform. Powered by certified RNG mathematics, instant UPI cashier, and 24-hour audited settlements.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-1.5">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Platform Links
            </div>
            <div className="flex flex-col space-y-1 text-[11px]">
              <button onClick={() => setCurrentScreen('LOBBY')} className="text-left hover:text-amber-300">
                Live Game Tables (8 Tiers)
              </button>
              <button onClick={() => { setWalletTab('DEPOSIT'); setCurrentScreen('WALLET'); }} className="text-left hover:text-amber-300">
                Deposit via UPI QR
              </button>
              <button onClick={() => { setWalletTab('WITHDRAWAL'); setCurrentScreen('WALLET'); }} className="text-left hover:text-amber-300">
                Withdraw to Bank (5% Fee)
              </button>
              <button onClick={() => setCurrentScreen('SUPPORT')} className="text-left hover:text-amber-300">
                Customer Grievance Desk
              </button>
              <button onClick={() => setCurrentScreen('DISTRIBUTION')} className="text-left hover:text-amber-300">
                Web Platform & Mobile PWA
              </button>
            </div>
          </div>

          {/* Compliance & States */}
          <div className="space-y-1.5">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Territorial Compliance
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Real-money play is void in states prohibiting skill/chance games: Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, and Sikkim. Strictly 18+ only.
            </p>
          </div>

          {/* Security & Infrastructure Credentials */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Security & Infrastructure
            </div>
            <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anti-DDoS Firewall Active</span>
              </div>
              <div className="text-[10px] text-slate-500">
                256-Bit SSL • Rate-Limited Sockets • Single Active Device Mutex
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              Provably Fair Random Deal • Instant UPI & Bank Settlements
            </div>
          </div>
        </div>

        {/* Statutory 18+ Disclaimer Footer Bar */}
        <div className="max-w-7xl mx-auto pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <div>
            ⚠️ <strong>FINANCIAL RISK NOTICE:</strong> Games on Joker Bet involve monetary risk and may be habit-forming. Play responsibly.
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>© 2026 Joker Bet Gaming Corp • All Rights Reserved</span>
            {/* Subtle operator keyhole icon in the extreme bottom corner (transparent, accessible for admin with Alt+A or click) */}
            <button
              onClick={() => setCurrentScreen('ADMIN')}
              title="Operator Gateway (Alt+A)"
              className="text-slate-800 hover:text-slate-500 transition-colors p-1"
            >
              <Lock className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Un-dismissible Single Active Session Revocation Modal (Device A) */}
      {sessionRevokedMessage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d111a] border-2 border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-4 border border-red-500/30">
              <Lock className="w-8 h-8" />
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
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0e121b] border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.25)]">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-4 border border-amber-500/30">
              <Shield className="w-8 h-8 text-amber-400" />
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
    </div>
  );
};
