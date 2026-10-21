import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DepositReservation, WithdrawalRequest } from '../../types/index';
import { ArrowDownToLine, ArrowUpFromLine, Trophy, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DEPOSITS' | 'WITHDRAWALS' | 'ROUNDS'>('DEPOSITS');
  const [deposits, setDeposits] = useState<DepositReservation[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getWalletHistory();
        if (res.success) {
          setDeposits(res.deposits || []);
          setWithdrawals(res.withdrawals || []);
          setRounds(res.gameRounds || []);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-4 bg-[#07090e] text-slate-100 select-none pb-16">
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-black text-white font-['Cinzel']">Account History</h2>
          <p className="text-xs text-slate-400">Complete immutable ledger of all transactions & game rounds</p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0c101c] p-1 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('DEPOSITS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DEPOSITS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deposits ({deposits.length})
          </button>
          <button
            onClick={() => setActiveTab('WITHDRAWALS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'WITHDRAWALS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Withdrawals ({withdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab('ROUNDS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ROUNDS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Game Rounds ({rounds.length})
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading ledger records...</div>
        ) : (
          <div className="space-y-2.5">
            {/* Deposits List */}
            {activeTab === 'DEPOSITS' && (
              <>
                {deposits.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">No deposits recorded yet.</div>
                ) : (
                  deposits.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-[#0b0e17] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                          <ArrowDownToLine className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 font-mono">+{d.amount} Coins (₹{d.amount})</div>
                          <div className="text-[10px] text-slate-400">
                            {d.utr ? `UTR: ${d.utr}` : 'Pending UTR'} • {formatDate(d.createdAt)}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : d.status === 'FAILED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Withdrawals List */}
            {activeTab === 'WITHDRAWALS' && (
              <>
                {withdrawals.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">No withdrawals requested yet.</div>
                ) : (
                  withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl bg-[#0b0e17] border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                            <ArrowUpFromLine className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 font-mono">
                              -{w.requestedCoins} Coins (Net ₹{w.netPayoutInr})
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Fee: {w.feeCoins} Coins (5%) • {formatDate(w.createdAt)}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : w.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>

                      {/* Expandable info for settled or rejected */}
                      {w.status === 'PAID' && w.bankUtr && (
                        <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-300">
                          Bank UTR: <strong>{w.bankUtr}</strong> (Settled via {w.adminSourceBankCode || 'RTGS/NEFT'})
                        </div>
                      )}

                      {w.status === 'REJECTED' && (
                        <div className="p-2 rounded bg-red-500/5 border border-red-500/20 text-[10px] text-red-300">
                          Rejection Reason: {w.rejectionReason} (100% coins refunded)
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}

            {/* Game Rounds List */}
            {activeTab === 'ROUNDS' && (
              <>
                {rounds.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">No game rounds played yet.</div>
                ) : (
                  rounds.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#0b0e17] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            r.isWinner
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">
                            {r.tierName} ({r.entryCoins} Coins)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Picked: #{r.selectedCard || 'None'} • Joker: #{r.jokerCard || '?'} • {formatDate(r.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            r.isWinner ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {r.isWinner ? `+${r.payoutCoins} Coins` : '0 Coins'}
                        </span>
                        <div className="text-[9px] text-slate-500 uppercase">{r.isWinner ? 'WINNER (2x)' : 'DEFEAT'}</div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
