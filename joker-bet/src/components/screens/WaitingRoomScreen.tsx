import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Clock,
  LogOut,
  ShieldCheck,
  Radio,
  Sparkles,
} from 'lucide-react';

export const WaitingRoomScreen: React.FC = () => {
  const { activeRoom, exitCurrentRoom, user } = useApp();
  const [exitLoading, setExitLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  // Compute countdown clock if countdownEndsAt is set
  useEffect(() => {
    if (!activeRoom || !activeRoom.countdownEndsAt) {
      setRemainingSec(null);
      return;
    }

    const updateTime = () => {
      const diff = Math.max(0, Math.floor((new Date(activeRoom.countdownEndsAt!).getTime() - Date.now()) / 1000));
      setRemainingSec(diff);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [activeRoom]);

  const handleExit = async () => {
    setExitLoading(true);
    await exitCurrentRoom();
    setExitLoading(false);
    setShowExitModal(false);
  };

  const playerCount = activeRoom?.players?.length || 0;
  const isCountdownActive = activeRoom?.status === 'COUNTDOWN' && remainingSec !== null;
  const isFull = playerCount >= 10;

  // Format seconds as MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-4 bg-[#07090e] text-slate-100 select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0c101b] border border-amber-500/20 shadow-md">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              MATCHMAKING LOBBY
            </div>
            <h2 className="text-base font-black text-white font-['Cinzel']">
              {activeRoom?.tierName || 'Room Table'}
            </h2>
            <div className="text-xs text-amber-300 font-mono">
              Entry: {activeRoom?.entryCoins} Coins • Win {(activeRoom ? activeRoom.entryCoins * 2 : 0)} Coins
            </div>
          </div>

          {/* Voluntary Exit Room Button (100% Refund) */}
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
            title="Exit and receive 100% instant refund"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Room</span>
          </button>
        </div>

        {/* Center Countdown & Radar Status */}
        <div className="my-5 flex flex-col items-center justify-center text-center">
          {/* Radar animation for State 1 (<3 players) */}
          {playerCount < 3 && (
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute w-28 h-28 rounded-full border border-amber-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0d121c] to-[#121826] border border-amber-500/40 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <Radio className="w-6 h-6 text-amber-400 animate-pulse mb-1" />
                <span className="font-mono text-sm font-bold text-slate-400">02:00</span>
              </div>
            </div>
          )}

          {/* Active Countdown for State 2 (3 to 9 players) */}
          {playerCount >= 3 && !isFull && (
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border-2 border-amber-400 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.3)] animate-pulse">
                <Clock className="w-6 h-6 text-amber-300 mb-0.5" />
                <span className="font-mono text-2xl font-black text-amber-200">
                  {formatTime(remainingSec || 0)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">
                  LAUNCHING
                </span>
              </div>
            </div>
          )}

          {/* State 3: Room Full! Instant Launch badge */}
          {isFull && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-400 rounded-2xl flex items-center gap-2 text-emerald-300 font-bold mb-3 animate-bounce">
              <Sparkles className="w-5 h-5" />
              <span>ROOM FULL (10/10)! Launching game instantly...</span>
            </div>
          )}

          {/* Subtitle status explanation */}
          <div className="space-y-0.5">
            {playerCount < 3 ? (
              <>
                <h3 className="text-sm font-bold text-amber-300">
                  Awaiting Players ({playerCount}/3 to start clock)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Timer starts automatically the millisecond 3rd player joins.
                </p>
              </>
            ) : isFull ? (
              <p className="text-xs text-slate-300">Maximum capacity reached. Transitioning to table...</p>
            ) : (
              <>
                <h3 className="text-sm font-bold text-emerald-400">
                  Matchmaking Active ({playerCount}/10 Players)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Game launches when clock hits 00:00 or when 10 players join!
                </p>
              </>
            )}
          </div>
        </div>

        {/* 10 Player Slots Roster (Circular Slots Grid) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Table Roster ({playerCount}/10 Slots)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Min 3 • Max 10</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 10 }).map((_, index) => {
              const player = activeRoom?.players?.[index];
              const isCurrentUser = player?.userId === user?.id;

              if (player) {
                return (
                  <div
                    key={player.userId}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                      isCurrentUser
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-[#0b0f19] border-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center font-bold text-xs text-black shrink-0">
                      {player.username.substring(1, 3).toUpperCase()}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{player.username}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Ready</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`empty_${index}`}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 text-slate-600"
                >
                  <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-xs italic text-slate-600">Waiting for player...</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guaranteed 100% Refund Safeguard Badge */}
      <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 flex items-center gap-2 mt-4">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-[10px] text-slate-400">
          <strong className="text-slate-300">100% Refund Protection:</strong> You can voluntarily exit this waiting room at any time before game start. Your entry fee of {activeRoom?.entryCoins} coins will be credited back instantly.
        </p>
      </div>

      {/* Voluntary Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0d121c] border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2 font-['Cinzel']">Exit Waiting Room?</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Your entry fee of <strong className="text-amber-300">{activeRoom?.entryCoins} Coins</strong> will be 100% refunded to your wallet balance immediately.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Stay in Room
              </button>
              <button
                onClick={handleExit}
                disabled={exitLoading}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md"
              >
                {exitLoading ? 'Refunding...' : 'Confirm Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
