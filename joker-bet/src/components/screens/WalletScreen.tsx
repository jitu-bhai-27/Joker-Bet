import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DepositReservation } from '../../types/index';
import {
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  QrCode,
  Copy,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  ExternalLink,
  Smartphone,
  History,
  LogIn,
} from 'lucide-react';

export const WalletScreen: React.FC = () => {
  const { user, config, activeRoom, walletTab, setWalletTab, refreshUserData, setCurrentScreen } = useApp();

  // Deposit states
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [reservation, setReservation] = useState<DepositReservation | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [remainingTimeSec, setRemainingTimeSec] = useState<number>(600);

  // Mismatch modal state
  const [mismatchModalOpen, setMismatchModalOpen] = useState(false);
  const [correctedAmountInput, setCorrectedAmountInput] = useState('');

  // Withdrawal states
  const [withdrawCoins, setWithdrawCoins] = useState<number>(500);
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 10-Minute Reservation timer
  useEffect(() => {
    if (!reservation || !reservation.expiresAt) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingTimeSec(diff);
      if (diff === 0) {
        setReservation(null);
        setDepositMsg({ type: 'error', text: '10-minute payment session expired. Please generate a fresh deposit session.' });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [reservation]);

  // Handle Reserve QR
  const handleReserveQr = async () => {
    if (!user) {
      setCurrentScreen('AUTH');
      return;
    }

    const minDep = config?.minDeposit || 10;
    if (!depositAmount || depositAmount < minDep) {
      setDepositMsg({
        type: 'error',
        text: `Minimum deposit amount is ${minDep} Coins (₹${minDep})`,
      });
      return;
    }

    setDepositMsg(null);
    setLoading(true);
    try {
      const res = await api.reserveQr(depositAmount);
      if (res.success && res.reservation) {
        setReservation(res.reservation);
        setUtrInput('');
      }
    } catch (err: any) {
      setDepositMsg({ type: 'error', text: err.message || 'Payment gateway connection failed. Please retry.' });
    } finally {
      setLoading(false);
    }
  };

  // Submit UTR
  const handleSubmitUtr = async () => {
    if (!reservation) return;
    if (!utrInput || utrInput.length !== 12 || !/^\d{12}$/.test(utrInput)) {
      setDepositMsg({ type: 'error', text: 'Please enter a valid 12-digit numeric Bank UTR Number.' });
      return;
    }

    setDepositMsg(null);
    setLoading(true);
    try {
      const res = await api.submitUtr(reservation.id, utrInput, false, false);
      if (res.success) {
        setDepositMsg({ type: 'success', text: res.message });
        setReservation(null);
        await refreshUserData();
      } else if (res.code === 'BANK_SYNC_DELAY') {
        setDepositMsg({ type: 'warning', text: res.message });
      } else if (res.code === 'AMOUNT_MISMATCH') {
        setMismatchModalOpen(true);
      }
    } catch (err: any) {
      setDepositMsg({ type: 'error', text: err.message || 'Verification failed. Please check UTR.' });
    } finally {
      setLoading(false);
    }
  };

  // Single-Attempt Amount Correction
  const handleAmountCorrection = async () => {
    if (!reservation) return;
    setLoading(true);
    try {
      const res = await api.correctDepositAmount(reservation.id, Number(correctedAmountInput));
      if (res.success) {
        setMismatchModalOpen(false);
        setReservation(null);
        setDepositMsg({ type: 'success', text: res.message });
        await refreshUserData();
      }
    } catch (err: any) {
      setMismatchModalOpen(false);
      setDepositMsg({ type: 'error', text: err.message || 'Amount correction failed. Please contact support.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Withdrawal Request
  const handleWithdrawal = async () => {
    if (!user) {
      setCurrentScreen('AUTH');
      return;
    }

    if (activeRoom) {
      setWithdrawMsg({
        type: 'error',
        text: 'Withdrawals are locked while registered in an active game or waiting room. Please complete or leave your table first.',
      });
      return;
    }

    const minWdr = config?.minWithdrawal || 100;
    if (!withdrawCoins || withdrawCoins < minWdr) {
      setWithdrawMsg({ type: 'error', text: `Minimum withdrawal is ${minWdr} Coins (₹${minWdr})` });
      return;
    }

    if ((user?.coins || 0) < withdrawCoins) {
      setWithdrawMsg({ type: 'error', text: 'Insufficient balance for requested withdrawal amount' });
      return;
    }

    if (!withdrawUpi.trim()) {
      setWithdrawMsg({ type: 'error', text: 'Please enter a valid target UPI ID (e.g. yourname@okaxis)' });
      return;
    }

    setWithdrawMsg(null);
    setWithdrawLoading(true);
    try {
      const res = await api.withdraw({
        coins: withdrawCoins,
        upiId: withdrawUpi.trim(),
      });

      if (res.success) {
        setWithdrawMsg({ type: 'success', text: res.message });
        await refreshUserData();
      }
    } catch (err: any) {
      setWithdrawMsg({ type: 'error', text: err.message || 'Withdrawal submission failed' });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const copyUpiId = () => {
    if (reservation?.upiId) {
      navigator.clipboard.writeText(reservation.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Fee calculation
  const feePercent = config?.commissionFeePercent || 5;
  const calculatedFee = Math.round(withdrawCoins * (feePercent / 100));
  const netPayout = Math.max(0, withdrawCoins - calculatedFee);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Quick preset chips for deposit
  const depositPresets = [100, 500, 1000, 2000, 5000, 10000];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Cinzel'] tracking-wide flex items-center gap-2.5">
            <Coins className="w-6 h-6 text-amber-400" />
            <span>Coin Banking & Cashier</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Instant UPI deposits • 24-hour audited bank withdrawals • 1 Coin = ₹1.00 INR guaranteed
          </p>
        </div>

        <button
          onClick={() => setCurrentScreen('HISTORY')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 hover:text-amber-300 transition-all self-start sm:self-auto"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>View Ledger & Status</span>
        </button>
      </div>

      {/* Guest / Unauthenticated State Guard */}
      {!user && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#101524] to-[#0a0d16] border border-amber-500/40 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-['Cinzel']">
              Player Authentication Required
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              Sign in with your email or enter with instant 1-tap demo access to deposit coins, manage withdrawals, and view your verified transaction ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentScreen('AUTH')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          </div>
        </div>
      )}

      {/* Authenticated Wallet Content */}
      {user && (
        <>
          {/* Balance Hero Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#101522] to-[#0c101a] border border-amber-500/40 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                  Available Playable Balance
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <Coins className="w-7 h-7 text-amber-400 self-center" />
                  <span className="text-3xl sm:text-4xl font-black text-amber-200 font-mono tracking-tight">
                    {user.coins.toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-400/90 font-mono">
                    Coins (₹{user.coins.toLocaleString()} INR)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  ● 1:1 Fixed INR Parity
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700 text-xs font-mono">
                  Player: {user.username || '@user'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>Universal Ledger: Deposit coins and table winnings merge seamlessly with zero lockup fees.</span>
              <span className="text-emerald-400 font-semibold">Verified Bank Settlement Ready</span>
            </div>
          </div>

          {/* Tab Navigation: [Instant Deposit] | [24h Withdrawal] */}
          <div className="grid grid-cols-2 gap-2 bg-[#0c101c] p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setWalletTab('DEPOSIT')}
              className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                walletTab === 'DEPOSIT'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Deposit Coins (Instant UPI)</span>
            </button>

            <button
              onClick={() => setWalletTab('WITHDRAWAL')}
              className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                walletTab === 'WITHDRAWAL'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Withdrawal (Bank & UPI)</span>
            </button>
          </div>

          {/* =================================================================== */}
          {/* DEPOSIT SECTION */}
          {/* =================================================================== */}
          {walletTab === 'DEPOSIT' && (
            <div className="space-y-5">
              {/* Status Feedback */}
              {depositMsg && (
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 text-xs leading-relaxed animate-in fade-in ${
                    depositMsg.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : depositMsg.type === 'warning'
                      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                      : 'bg-red-500/15 border-red-500/40 text-red-300'
                  }`}
                >
                  {depositMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{depositMsg.text}</span>
                </div>
              )}

              {!reservation ? (
                /* Step 1: Select Amount */
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                      Enter Deposit Amount (Coins = ₹ INR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={config?.minDeposit || 10}
                        max={config?.maxDeposit || 100000}
                        value={depositAmount || ''}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full bg-[#07090e] border border-slate-700 rounded-2xl px-4 py-3.5 text-xl font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 transition-all pl-10"
                        placeholder="e.g. 500"
                      />
                      <span className="absolute left-4 top-4 text-base font-bold text-slate-500">₹</span>
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-1.5">
                      Minimum: {config?.minDeposit || 10} Coins (₹{config?.minDeposit || 10}) • Maximum: ₹1,00,000 per transaction
                    </span>
                  </div>

                  {/* Preset Quick Chips */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 mb-2">
                      Quick Selection:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {depositPresets.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`py-2.5 rounded-xl text-xs font-bold border font-mono transition-all ${
                            depositAmount === amt
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          +₹{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Secure Gateway Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300">
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>All UPI Apps: PhonePe, GPay, Paytm</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Instant 12-Digit UTR Crediting</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#07090e] border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>256-Bit SSL Encrypted Banking</span>
                    </div>
                  </div>

                  {/* Generate QR Button */}
                  <button
                    onClick={handleReserveQr}
                    disabled={loading || !depositAmount || depositAmount < (config?.minDeposit || 10)}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>{loading ? 'Initializing Secure Payment...' : `Generate Dynamic UPI QR for ₹${depositAmount}`}</span>
                  </button>
                </div>
              ) : (
                /* Step 2: Active QR Session */
                <div className="p-5 sm:p-6 rounded-3xl bg-[#0c101c] border border-amber-500/40 shadow-2xl space-y-5">
                  {/* Countdown Timer Alert */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>Payment Session Expires In:</span>
                    </div>
                    <span className="font-mono font-black text-amber-200 text-base">
                      {formatSec(remainingTimeSec)}
                    </span>
                  </div>

                  {/* QR Image Display */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl max-w-[240px] mx-auto shadow-2xl">
                    <img
                      src={reservation.qrImageUrl}
                      alt="Scan UPI QR"
                      className="w-52 h-52 object-contain"
                    />
                    <span className="text-[11px] font-black text-slate-900 mt-2 uppercase tracking-wider font-mono">
                      Scan with Any UPI App
                    </span>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="text-center space-y-1">
                    <div className="text-xs text-slate-400">Pay Exact Amount:</div>
                    <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">
                      ₹{reservation.amount}.00 INR
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Credited as {reservation.amount} Joker Bet Coins
                    </div>
                  </div>

                  {/* Copy UPI VPA */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#07090e] border border-slate-700 text-xs">
                    <span className="font-mono text-slate-200 truncate pr-2 font-medium">{reservation.upiId}</span>
                    <button
                      onClick={copyUpiId}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                    </button>
                  </div>

                  {/* Direct Mobile UPI Intent Buttons */}
                  <div className="space-y-1.5">
                    <span className="block text-[11px] text-slate-400 text-center font-semibold">
                      Or tap to launch UPI app directly on mobile:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`upi://pay?pa=${reservation.upiId}&pn=JokerBet&am=${reservation.amount}&cu=INR`}
                        className="py-2.5 rounded-xl bg-[#141b29] hover:bg-[#1a2334] text-center text-xs font-bold text-slate-200 border border-slate-700/80 transition-colors"
                      >
                        Google Pay
                      </a>
                      <a
                        href={`upi://pay?pa=${reservation.upiId}&pn=JokerBet&am=${reservation.amount}&cu=INR`}
                        className="py-2.5 rounded-xl bg-[#141b29] hover:bg-[#1a2334] text-center text-xs font-bold text-slate-200 border border-slate-700/80 transition-colors"
                      >
                        PhonePe
                      </a>
                      <a
                        href={`upi://pay?pa=${reservation.upiId}&pn=JokerBet&am=${reservation.amount}&cu=INR`}
                        className="py-2.5 rounded-xl bg-[#141b29] hover:bg-[#1a2334] text-center text-xs font-bold text-slate-200 border border-slate-700/80 transition-colors"
                      >
                        Paytm
                      </a>
                    </div>
                  </div>

                  {/* 12-Digit UTR Input Form */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Enter 12-Digit Bank UTR / Ref Number from your UPI App:
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 408512349876 (12 digits)"
                      className="w-full bg-[#07090e] border border-slate-700 rounded-2xl px-4 py-3.5 text-base font-mono tracking-wider text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all text-center"
                    />

                    <button
                      onClick={handleSubmitUtr}
                      disabled={loading || utrInput.length !== 12}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all ${
                        loading || utrInput.length !== 12
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                      }`}
                    >
                      {loading ? 'Verifying with Bank...' : 'Submit 12-Digit UTR for Verification'}
                    </button>

                    <button
                      onClick={() => setReservation(null)}
                      className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Cancel & Change Amount
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* WITHDRAWAL SECTION */}
          {/* =================================================================== */}
          {walletTab === 'WITHDRAWAL' && (
            <div className="space-y-5">
              {/* Active Room Lock Notice */}
              {activeRoom && (
                <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-2xl flex items-center gap-3 text-xs text-red-300">
                  <Lock className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Withdrawal Locked During Active Game</div>
                    <div>You are currently registered in a game or waiting room. Please complete or exit your table before withdrawing coins.</div>
                  </div>
                </div>
              )}

              {/* Status Feedback */}
              {withdrawMsg && (
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 text-xs leading-relaxed animate-in fade-in ${
                    withdrawMsg.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-500/15 border-red-500/40 text-red-300'
                  }`}
                >
                  {withdrawMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{withdrawMsg.text}</span>
                </div>
              )}

              <div className="p-5 sm:p-6 rounded-3xl bg-[#0c101c] border border-slate-800 space-y-5">
                {/* Withdrawal Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Withdrawal Coins (Min: {config?.minWithdrawal || 100})
                    </label>
                    <span className="text-xs text-amber-300 font-mono font-semibold">
                      Max: {user.coins.toLocaleString()} Coins
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={config?.minWithdrawal || 100}
                      max={user.coins}
                      value={withdrawCoins || ''}
                      onChange={(e) => setWithdrawCoins(Number(e.target.value))}
                      disabled={Boolean(activeRoom)}
                      className="w-full bg-[#07090e] border border-slate-700 rounded-2xl px-4 py-3.5 text-xl font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 transition-all pl-10"
                      placeholder="e.g. 500"
                    />
                    <Coins className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                  </div>
                </div>

                {/* Percentage Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 0.75, 1.0].map((pct) => {
                    const amt = Math.max(100, Math.floor(user.coins * pct));
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setWithdrawCoins(amt)}
                        disabled={user.coins < 100}
                        className="py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-slate-700 font-mono transition-all disabled:opacity-40"
                      >
                        {pct === 1.0 ? 'All Balance' : `${pct * 100}%`}
                      </button>
                    );
                  })}
                </div>

                {/* Fee and Net Payout Calculation */}
                <div className="p-4 rounded-2xl bg-[#07090e] border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Withdrawal:</span>
                    <span className="font-mono text-slate-200">{withdrawCoins || 0} Coins (₹{withdrawCoins || 0})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform Commission ({feePercent}%):</span>
                    <span className="font-mono text-amber-400">-{calculatedFee} Coins</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 border-t border-slate-800 pt-2 text-sm">
                    <span>Net Bank Payout (INR):</span>
                    <span className="font-mono font-black text-lg">₹{netPayout.toFixed(2)} INR</span>
                  </div>
                </div>

                {/* UPI-only destination */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    Payout Method
                  </label>
                  <div className="p-3 rounded-2xl border bg-amber-500/10 border-amber-500 text-white flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold text-xs">Instant UPI VPA</div>
                        <div className="text-[10px] text-slate-400">GPay, PhonePe, BHIM</div>
                      </div>
                  </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Your Personal UPI ID
                    </label>
                    <input
                      type="text"
                      value={withdrawUpi}
                      onChange={(e) => setWithdrawUpi(e.target.value)}
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      disabled={Boolean(activeRoom)}
                      className="w-full bg-[#07090e] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                </div>

                {/* Submit Withdrawal Request */}
                <button
                  onClick={handleWithdrawal}
                  disabled={withdrawLoading || Boolean(activeRoom) || (user?.coins || 0) < withdrawCoins || withdrawCoins < (config?.minWithdrawal || 100)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all ${
                    withdrawLoading || Boolean(activeRoom) || (user?.coins || 0) < withdrawCoins || withdrawCoins < (config?.minWithdrawal || 100)
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  {withdrawLoading
                    ? 'Submitting to Settlement Queue...'
                    : `Debit ${withdrawCoins} Coins & Request ₹${netPayout.toFixed(2)} Payout`}
                </button>

                <p className="text-[11px] text-center text-slate-500 leading-tight">
                  ⚡ All payouts audited and transferred via bank within 24 operational hours. 100% coins auto-refunded if bank reject occurs.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Amount Mismatch Correction Modal */}
      {mismatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d121c] border-2 border-yellow-500/50 rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-400 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 font-['Cinzel']">
              Amount Mismatch Detected!
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              The transferred bank amount does not match your requested {reservation?.amount} Coins.
              <br />
              <strong className="text-yellow-300">Single Attempt:</strong> Enter the exact Rupee amount you transferred via UPI to verify and credit coins immediately.
            </p>

            <input
              type="number"
              value={correctedAmountInput}
              onChange={(e) => setCorrectedAmountInput(e.target.value)}
              placeholder="Enter exact transferred INR"
              className="w-full bg-[#07090e] border border-yellow-500/50 rounded-2xl px-4 py-3 text-center font-mono font-bold text-yellow-300 mb-4 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setMismatchModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAmountCorrection}
                disabled={loading || !correctedAmountInput}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-md"
              >
                {loading ? 'Verifying...' : 'Verify Correct Amount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
