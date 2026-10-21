import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Coins,
  Users,
  Flame,
  Trophy,
  ShieldCheck,
  Volume2,
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  Award,
} from 'lucide-react';

export const LobbyScreen: React.FC = () => {
  const { user, config, joinRoomTier, setCurrentScreen, setWalletTab } = useApp();
  const [tiers, setTiers] = useState<any[]>([]);
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch live room tier states
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.getRooms();
        if (res.success && res.tiers) {
          setTiers(res.tiers);
        }
      } catch (err) {
        console.error('Failed to load room tiers:', err);
      }
    };

    loadRooms();
    const interval = setInterval(loadRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (tierId: string, entryCoins: number) => {
    if (!user) {
      setCurrentScreen('AUTH');
      return;
    }

    if (user.coins < entryCoins) {
      setErrorMsg(`Insufficient balance! Entry is ${entryCoins} Coins, your balance is ${user.coins} Coins.`);
      setWalletTab('DEPOSIT');
      setTimeout(() => setCurrentScreen('WALLET'), 1000);
      return;
    }

    setErrorMsg('');
    setLoadingTierId(tierId);
    const res = await joinRoomTier(tierId);
    setLoadingTierId(null);
    if (!res.success && res.message) {
      setErrorMsg(res.message);
    }
  };

  const activeTiers = tiers.length > 0 ? tiers : config?.roomTiers || [];

  return (
    <div className="w-full space-y-5 sm:space-y-6 select-none animate-in fade-in duration-300 pb-6 sm:pb-12">
      {/* Mobile-first status strip: intentionally static to avoid the old ticker overlap. */}
      <div className="rounded-2xl bg-[#0b0f19] border border-amber-500/20 px-3 py-2.5 shadow-md">
        <div className="flex items-start gap-2.5 sm:items-center">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold shrink-0 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 font-mono text-[10px] sm:text-[11px]">
            <Volume2 className="w-3.5 h-3.5" />
            <span>LIVE WINNER</span>
          </div>
          <div className="min-w-0 flex-1 text-[11px] leading-relaxed text-slate-300 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
            <span className="block font-bold text-amber-300 sm:inline">👑 @royal_joker won 2,000 Coins</span>
            <span className="block text-slate-400 sm:inline">Instant deposits • Fair play verified • Waiting-room refund</span>
          </div>
        </div>
      </div>

      {/* Hero Welcome & Value Proposition Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#101524] to-[#0a0d16] border border-amber-500/30 p-5 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-300 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multiplayer 3-Card Joker Arena</span>
          </div>

          <h1 className="text-[1.7rem] sm:text-4xl font-black text-white font-['Cinzel'] tracking-wide leading-[1.12]">
            Select Your Card. Lock Choice. Win <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">2.0x Coins!</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Choose from 8 entry tiers from <strong className="text-amber-300">10 Coins (₹10)</strong> up to <strong className="text-amber-300">1,000 Coins (₹1,000)</strong>. Compete with 3 to 10 players per table with 120s guessing window and 10s suspense reveal.
          </p>

          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            {!user ? (
              <button
                onClick={() => setCurrentScreen('AUTH')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2"
              >
                <span>Sign In To Start Playing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <button
                  onClick={() => {
                    const firstTier = activeTiers[0];
                    if (firstTier) handleJoin(firstTier.id, firstTier.entryCoins);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Quick Join Novice Table</span>
                </button>
                <button
                  onClick={() => {
                    setWalletTab('DEPOSIT');
                    setCurrentScreen('WALLET');
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Add Coins</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono sm:ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Fixed 1:1 INR Parity</span>
            </div>
          </div>
        </div>

        {/* Decorative Golden Crown Emblems */}
        <div className="absolute right-4 bottom-2 sm:right-8 sm:bottom-4 text-7xl sm:text-9xl opacity-20 pointer-events-none select-none filter drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          🃏
        </div>
      </div>

      {/* Error Alert Notice */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-300 animate-in fade-in">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 8 Dynamic Room Tier Cards (Responsive Grid: 1 col on mobile, 2 on tablet, 4 on desktop) */}
      <div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-['Cinzel'] tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Live Game Tables</span><span className="text-amber-300">(8 Tiers)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              3 to 10 players per table • Instant launch at 10 players • 100% exit refund during waiting phase
            </p>
          </div>
          <span className="hidden sm:inline text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            ● Real-Time Matchmaking Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeTiers.map((tier: any) => {
            const isHighRoller = tier.entryCoins >= 500;
            const isLoading = loadingTierId === tier.id;
            const winCoins = tier.entryCoins * (tier.winnerMultiplier || 2.0);

            return (
              <div
                key={tier.id}
                className={`group relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  isHighRoller
                    ? 'bg-gradient-to-b from-[#18130c] via-[#0e111a] to-[#080b13] border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'bg-[#0b0e17] border-slate-800 hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Award className={`w-4 h-4 ${isHighRoller ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs text-slate-100 group-hover:text-amber-300 transition-colors">
                      {tier.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    2.0X WIN
                  </span>
                </div>

                {/* Entry & Prize */}
                <div className="space-y-1 mb-4 p-3 rounded-xl bg-[#06080e] border border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Entry Fee:</span>
                    <span className="text-lg font-black text-amber-300 font-mono">
                      {tier.entryCoins} Coins
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-800/60 pt-1">
                    <span className="text-[11px] text-slate-400">Winner Payout:</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      +{winCoins.toLocaleString()} Coins
                    </span>
                  </div>
                </div>

                {/* Live Count & Join Button */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tier.currentPlayers || 0} players online</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">3 - 10 Seats</span>
                  </div>

                  <button
                    onClick={() => handleJoin(tier.id, tier.entryCoins)}
                    disabled={isLoading}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 ${
                      isHighRoller
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)] transform active:scale-95'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transform active:scale-95'
                    }`}
                  >
                    <span>{isLoading ? 'Joining Table...' : 'Join Table'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fair Play & Trust Integrity Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-2xl bg-[#0b0e17] border border-slate-800 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Provably Fair Gaming
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cryptographically verified random shuffles ensure complete transparency and fair odds on every card reveal.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0e17] border border-slate-800 flex items-start gap-3">
          <Activity className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Instant UPI Gateway
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              High-speed dynamic QR processing with immediate 12-digit UTR confirmation and instant wallet crediting.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b0e17] border border-slate-800 flex items-start gap-3">
          <Shield className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              100% Exit Refund Protection
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Exit any waiting table voluntarily before gameplay starts to receive an immediate 100% refund of your frozen entry coins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
