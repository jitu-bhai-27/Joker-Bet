import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  Lock,
  Clock,
  Sparkles,
  Trophy,
  Users,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const GameTableScreen: React.FC = () => {
  const { activeRoom, user, lockCardChoice, setCurrentScreen, config } = useApp();

  const [highlightedCard, setHighlightedCard] = useState<number | null>(null);
  const [locking, setLocking] = useState(false);
  const [guessingSec, setGuessingSec] = useState<number>(120);
  const [revealSec, setRevealSec] = useState<number>(10);
  const [confettiFired, setConfettiFired] = useState(false);

  // Find current player in active room
  const currentPlayer = activeRoom?.players?.find((p) => p.userId === user?.id);
  const isLocked = currentPlayer?.isLocked || false;
  const lockedCard = currentPlayer?.selectedCard || null;

  // Sync timers with server timestamps
  useEffect(() => {
    if (!activeRoom) return;

    const tick = () => {
      const now = Date.now();

      // Guessing countdown
      if (activeRoom.status === 'GUESSING' && activeRoom.guessingEndsAt) {
        const diff = Math.max(0, Math.floor((new Date(activeRoom.guessingEndsAt).getTime() - now) / 1000));
        setGuessingSec(diff);
      }

      // 10s Reveal suspense countdown
      if (activeRoom.status === 'REVEALING' && activeRoom.revealEndsAt) {
        const diff = Math.max(0, Math.floor((new Date(activeRoom.revealEndsAt).getTime() - now) / 1000));
        setRevealSec(diff);
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [activeRoom]);

  // Confetti trigger for winners during reveal/ended
  useEffect(() => {
    if ((activeRoom?.status === 'REVEALING' || activeRoom?.status === 'ENDED') && currentPlayer?.isWinner && !confettiFired) {
      setConfettiFired(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24'],
      });
    }
  }, [activeRoom?.status, currentPlayer?.isWinner, confettiFired]);

  const handleSelectCard = (index: number) => {
    if (isLocked || activeRoom?.status !== 'GUESSING') return;
    setHighlightedCard(index);
  };

  const handleCommitLock = async () => {
    if (!highlightedCard || isLocked || activeRoom?.status !== 'GUESSING') return;
    setLocking(true);
    await lockCardChoice(highlightedCard);
    setLocking(false);
  };

  const isRevealing = activeRoom?.status === 'REVEALING';
  const isEnded = activeRoom?.status === 'ENDED';
  const showCardFaces = isEnded || (isRevealing && revealSec <= 0);

  const cardAssets = config?.cardAssets || {
    cardBack: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
    jokerFace: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    nonJokerFace1: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    nonJokerFace2: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  };

  const totalPlayers = activeRoom?.players?.length || 0;
  const lockedCount = activeRoom?.players?.filter((p) => p.isLocked).length || 0;

  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between p-4 sm:p-6 bg-radial from-[#121827] via-[#070a12] to-[#04060a] text-slate-100 select-none relative overflow-hidden rounded-3xl border border-amber-500/20 shadow-2xl">
      {/* Top HUD Bar */}
      <div>
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#0c101c]/90 border border-amber-500/30 backdrop-blur-md shadow-lg">
          <div>
            <div className="text-[10px] sm:text-xs uppercase font-bold text-amber-400 font-mono tracking-widest">
              {activeRoom?.tierName}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>Entry: {activeRoom?.entryCoins} Coins</span>
              <span className="text-emerald-400 font-mono">• Win {(activeRoom?.entryCoins || 0) * 2} Coins</span>
            </div>
          </div>

          {/* Active Guessing Clock */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#080c16] border border-amber-500/40 rounded-xl px-3 sm:px-4 py-1.5 shadow-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-base sm:text-lg font-black text-amber-200">
                {activeRoom?.status === 'GUESSING' ? `${guessingSec}s` : 'REVEAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Lock Progress Meter */}
        <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Players Locked:</span>
            <strong className="text-amber-300 font-mono">{lockedCount} / {totalPlayers}</strong>
          </div>
          <div className="text-[11px] text-slate-500 italic hidden sm:inline">Opponent choices are 100% secret & encrypted</div>
        </div>
      </div>

      {/* 3 Interactive Cards Arena */}
      <div className="my-auto py-4 sm:py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-3xl font-black text-white font-['Cinzel'] tracking-wide">
            {isRevealing || isEnded
              ? 'THE JOKER REVEAL'
              : isLocked
              ? `Card #${lockedCard} Locked Permanently`
              : 'Select Card & Tap "Lock Card"'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {isLocked
              ? 'Your choice is recorded on the backend. Waiting for round timer to expire.'
              : 'You can freely switch between cards until you commit your choice.'}
          </p>
        </div>

        {/* The 3 Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-sm sm:max-w-xl mx-auto perspective-1000">
          {[1, 2, 3].map((cardIdx) => {
            const isSelected = isLocked ? lockedCard === cardIdx : highlightedCard === cardIdx;
            const isWinnerCard = showCardFaces && activeRoom?.jokerCard === cardIdx;

            let faceImage = cardAssets.cardBack;
            if (showCardFaces) {
              if (activeRoom?.jokerCard === cardIdx) {
                faceImage = cardAssets.jokerFace;
              } else if (cardIdx === 1) {
                faceImage = cardAssets.nonJokerFace1;
              } else {
                faceImage = cardAssets.nonJokerFace2;
              }
            }

            return (
              <div
                key={cardIdx}
                onClick={() => handleSelectCard(cardIdx)}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                  isSelected ? 'transform -translate-y-2' : 'hover:-translate-y-1'
                }`}
              >
                {/* 3D Card Container */}
                <div
                  className={`w-full aspect-[2/3] rounded-2xl p-[3px] transition-all duration-500 relative overflow-hidden shadow-2xl ${
                    isSelected
                      ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-105'
                      : 'bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-700/60 opacity-90'
                  } ${isWinnerCard ? 'ring-4 ring-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.8)]' : ''}`}
                >
                  <div className="w-full h-full rounded-[13px] bg-[#0b0e17] overflow-hidden relative flex flex-col items-center justify-between p-2">
                    {/* Background Artwork */}
                    <img
                      src={faceImage}
                      alt={`Card ${cardIdx}`}
                      className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                    {/* Top Card Number */}
                    <div className="relative z-10 w-full flex items-center justify-between text-xs font-bold text-white">
                      <span className="font-mono bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                        #{cardIdx}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-amber-300 font-extrabold uppercase">
                          {isLocked ? 'LOCKED' : 'PICK'}
                        </span>
                      )}
                    </div>

                    {/* Center Climax Badge if Revealed */}
                    {showCardFaces && (
                      <div className="relative z-10 text-center animate-in zoom-in duration-300">
                        {isWinnerCard ? (
                          <div className="bg-emerald-500/90 text-black px-2 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-lg">
                            🃏 JOKER
                          </div>
                        ) : (
                          <div className="bg-black/80 text-slate-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700">
                            NO JOKER
                          </div>
                        )}
                      </div>
                    )}

                    {/* Locked Badge if committed */}
                    {isLocked && lockedCard === cardIdx && !showCardFaces && (
                      <div className="relative z-10 w-full flex items-center justify-center gap-1 bg-emerald-500/90 text-black py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md">
                        <Lock className="w-3 h-3" />
                        <span>LOCKED</span>
                      </div>
                    )}

                    {/* Bottom Label */}
                    <div className="relative z-10 text-[10px] text-slate-300 font-medium">
                      Card {cardIdx}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Tray & Lock Button */}
      <div className="space-y-3">
        {/* If Guessing and Not Locked */}
        {activeRoom?.status === 'GUESSING' && !isLocked && (
          <div className="space-y-2">
            <button
              onClick={handleCommitLock}
              disabled={!highlightedCard || locking}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 ${
                !highlightedCard || locking
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_25px_rgba(245,158,11,0.4)] transform active:scale-95'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {locking
                  ? 'Locking Choice...'
                  : highlightedCard
                  ? `Lock Card #${highlightedCard} Permanently`
                  : 'Tap Any Card Above to Select'}
              </span>
            </button>
            <p className="text-[10px] text-center text-slate-400">
              ⚠️ Inaction Penalty: Failing to lock before 00:00 forfeits your round.
            </p>
          </div>
        )}

        {/* If Locked Confirmation */}
        {activeRoom?.status === 'GUESSING' && isLocked && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-emerald-300">
                Card #{lockedCard} Confirmed & Locked!
              </div>
              <div className="text-[10px] text-slate-400">
                Your choice is locked on the server. When the 120s timer ends, the 10s reveal will begin.
              </div>
            </div>
          </div>
        )}

        {/* If Game Ended: Return to Lobby Button */}
        {isEnded && (
          <button
            onClick={() => setCurrentScreen('LOBBY')}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <span>Play Next Round in Lobby</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 10-Second Suspense Reveal Central Overlay */}
      {isRevealing && revealSec > 0 && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full border-4 border-amber-500/40 border-t-amber-400 animate-spin flex items-center justify-center" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-black text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse">
                {revealSec}
              </span>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mt-1">
                SECONDS
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-black text-white font-['Cinzel'] tracking-wide">
            REVEALING THE JOKER
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Shuffling & verifying card sequence... Prepare for simultaneous card reveal!
          </p>
        </div>
      )}

      {/* Round Result & Full Scoreboard Modal (After Reveal) */}
      {showCardFaces && (
        <div className="mt-4 p-3 rounded-2xl bg-[#090d16]/95 border border-amber-500/30">
          {/* Winner or Defeat Alert */}
          {currentPlayer?.isWinner ? (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border border-emerald-500/50 flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-yellow-400 shrink-0 animate-bounce" />
              <div>
                <div className="text-sm font-black text-emerald-300 font-['Cinzel']">
                  CONGRATULATIONS! YOU WON!
                </div>
                <div className="text-xs text-amber-300 font-mono font-bold">
                  +{(activeRoom?.entryCoins || 0) * 2} Coins Credited Instantly
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 mb-3 text-xs text-slate-400">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>
                {currentPlayer?.isLocked
                  ? `You chose Card #${lockedCard}. The winning Joker was Card #${activeRoom?.jokerCard}. Better luck next round!`
                  : 'Round forfeited due to inaction. Please lock a card before timer ends.'}
              </span>
            </div>
          )}

          {/* Full Room Scoreboard */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Full Room Scoreboard</span>
              <span className="text-amber-400">Winning Card: #{activeRoom?.jokerCard}</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
              {activeRoom?.players?.map((p) => {
                const isMe = p.userId === user?.id;
                return (
                  <div
                    key={p.userId}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                      isMe
                        ? 'bg-amber-500/10 border-amber-500/40 font-bold'
                        : 'bg-[#0d111b] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.username}</span>
                      {isMe && <span className="text-[9px] text-amber-400">(YOU)</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {p.isLocked ? `Card #${p.selectedCard}` : 'No Lock'}
                      </span>
                      {p.isWinner ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          +{(activeRoom?.entryCoins || 0) * 2}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">0</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
