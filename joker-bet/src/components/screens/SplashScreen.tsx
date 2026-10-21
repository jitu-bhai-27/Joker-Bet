import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { setCurrentScreen, user } = useApp();

  return (
    <div className="w-full h-full min-h-[700px] flex flex-col items-center justify-between p-6 bg-radial from-[#131929] via-[#090c14] to-[#040609] select-none text-center">
      {/* Top Brand Tag */}
      <div className="pt-8 flex items-center gap-1.5 opacity-80">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-xs uppercase tracking-[0.25em] text-amber-300 font-semibold">
          High-Stakes 3-Card Engine
        </span>
      </div>

      {/* Main Center Emblem */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative mb-6">
          {/* Glowing Aura */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 rounded-full blur-2xl animate-pulse" />

          {/* Golden Shield Frame */}
          <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-[3px] shadow-[0_0_40px_rgba(245,158,11,0.4)]">
            <div className="w-full h-full bg-[#0b0e17] rounded-[21px] flex flex-col items-center justify-center overflow-hidden">
              <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-bounce">
                🃏
              </span>
              <span className="text-[10px] font-black tracking-widest text-amber-400 mt-1 uppercase font-mono">
                ROYAL
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-wider bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-['Cinzel'] drop-shadow-md">
          JOKER BET
        </h1>
        <p className="text-xs text-slate-400 mt-2 tracking-widest uppercase font-medium">
          Find The Joker • Win 2.0x Coins
        </p>

        {/* Currency Parity Badge */}
        <div className="mt-4 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
          1 Coin = ₹1.00 INR (1:1 Fixed Parity)
        </div>

        {/* Action Button */}
        <button
          onClick={() => setCurrentScreen(user ? 'LOBBY' : 'AUTH')}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm tracking-wide rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all transform active:scale-95"
        >
          {user ? 'ENTER LOBBY' : 'GET STARTED'}
        </button>
      </div>

      {/* Statutory 18+ & Compliance Disclaimer Footer */}
      <footer className="pb-4 w-full max-w-sm">
        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-500 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>STRICTLY 18+ ONLY • PLAY RESPONSIBLY</span>
        </div>
        <p className="text-[9px] text-slate-500 leading-tight">
          Games on Joker Bet involve financial risk and may be habit-forming. Not offered in Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, or Sikkim.
        </p>
      </footer>
    </div>
  );
};
