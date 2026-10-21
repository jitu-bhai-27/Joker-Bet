import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Mail, KeyRound, UserCheck, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { setUser, setCurrentScreen, refreshUserData } = useApp();

  const [step, setStep] = useState<'LOGIN' | 'PROFILE'>('LOGIN');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [confirmed18Plus, setConfirmed18Plus] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Profile setup fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available?: boolean; message?: string }>({
    checking: false,
  });

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Debounced live username availability checker
  useEffect(() => {
    if (step !== 'PROFILE') return;
    if (!username.trim()) {
      setUsernameStatus({ checking: false });
      return;
    }

    const handler = setTimeout(async () => {
      setUsernameStatus({ checking: true });
      try {
        const res = await api.checkUsername(username);
        setUsernameStatus({ checking: false, available: res.available, message: res.message });
      } catch (err) {
        setUsernameStatus({ checking: false, available: false, message: 'Check failed' });
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [username, step]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.sendOtp(email);
      setCooldown(60);
      if (res.debugOtp) {
        setDebugOtp(res.debugOtp);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      setErrorMsg('Please enter both Email and 6-digit OTP');
      return;
    }
    if (!confirmed18Plus) {
      setErrorMsg('You must certify that you are 18 years of age or older.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(email, otp, confirmed18Plus);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.isNewUser || !res.user.username) {
          setStep('PROFILE');
        } else {
          await refreshUserData();
          setCurrentScreen('LOBBY');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username || usernameStatus.available === false) {
      setErrorMsg('Please choose an available unique @username');
      return;
    }

    if (dob) {
      const birthDate = new Date(dob);
      const ageDiff = Date.now() - birthDate.getTime();
      const age = Math.abs(new Date(ageDiff).getUTCFullYear() - 1970);
      if (age < 18) {
        setErrorMsg('You must be at least 18 years of age to register.');
        return;
      }
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.setupProfile({
        username,
        fullName,
        dob,
        gender,
      });
      if (res.success) {
        setUser(res.user);
        await refreshUserData();
        setCurrentScreen('LOBBY');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-5 bg-[#07090e] text-slate-100 select-none">
      {/* Top Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              🃏
            </div>
            <span className="font-bold tracking-wider text-base bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent font-['Cinzel']">
              JOKER BET
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            SECURE ACCESS
          </span>
        </div>

        <h2 className="text-2xl font-black text-white font-['Cinzel']">
          {step === 'LOGIN' ? 'Player Sign In' : 'Create Public Handle'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {step === 'LOGIN'
            ? 'Authenticate via Email OTP with single active session protection'
            : 'Set your unique @username visible on live tables and game scoreboards'}
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="my-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Login Form */}
      {step === 'LOGIN' && (
        <div className="space-y-4 my-auto">
          {/* Quick 1-Tap Login Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 border border-amber-500/40 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>One-Tap Demo Access</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                ₹2,500 COINS PRE-LOADED
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Instant login as verified VIP player <strong className="text-white">@royal_joker</strong> without typing.
            </p>
            <button
              type="button"
              onClick={async () => {
                setEmail('player@jokerbet.com');
                setOtp('777777');
                setConfirmed18Plus(true);
                setLoading(true);
                setErrorMsg('');
                try {
                  const res = await api.verifyOtp('player@jokerbet.com', '777777', true);
                  if (res.success && res.user) {
                    setUser(res.user);
                    await refreshUserData();
                    setCurrentScreen('LOBBY');
                  }
                } catch (e: any) {
                  setErrorMsg(e.message || 'Login error');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              <span>{loading ? 'Entering Casino...' : '⚡ Tap Here to Enter Game Lobby (Instant Login)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest">Or Sign In Manually</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full bg-[#0d121c] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-all pl-10"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Send OTP button & Debug OTP trigger */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleSendOtp}
              disabled={loading || cooldown > 0 || !email}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                cooldown > 0
                  ? 'bg-slate-800/50 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Send 6-Digit OTP'}
            </button>

            {/* Quick Demo Fill Shortcut for instant testing */}
            <button
              onClick={() => {
                setEmail('player@jokerbet.com');
                setOtp('777777');
                setConfirmed18Plus(true);
              }}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
              title="Auto-fill verified demo credentials"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Fill Form</span>
            </button>
          </div>

          {/* If OTP generated, show banner */}
          {debugOtp && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300">Test OTP Code:</span>
              <button
                onClick={() => setOtp(debugOtp)}
                className="font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 hover:bg-amber-500/30"
              >
                {debugOtp} (Click to insert)
              </button>
            </div>
          )}

          {/* OTP input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              6-Digit Verification Code
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-[#0d121c] border border-slate-700/80 rounded-xl px-4 py-3 text-base font-mono tracking-widest text-center text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/80 transition-all pl-10"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Mandatory 18+ statutory check */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0b0e17] border border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed18Plus}
              onChange={(e) => setConfirmed18Plus(e.target.checked)}
              className="mt-0.5 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span className="text-[11px] text-slate-300 leading-snug">
              I certify that I am <strong className="text-amber-400">18 years of age or older</strong>, and I agree to the{' '}
              <span className="underline text-slate-200">Terms of Service</span> &{' '}
              <span className="underline text-slate-200">Responsible Gaming Policy</span>.
            </span>
          </label>

          {/* Submit Verify */}
          <button
            onClick={handleVerifyOtp}
            disabled={loading || !otp || !email || !confirmed18Plus}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading || !otp || !email || !confirmed18Plus
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            }`}
          >
            <span>{loading ? 'Verifying...' : 'Authenticate & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Handle & Profile Setup */}
      {step === 'PROFILE' && (
        <div className="space-y-4 my-auto">
          {/* Unique username handle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Mandatory Unique Handle (@username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="lucky_ace"
                className="w-full bg-[#0d121c] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-all pl-9"
              />
              <span className="text-amber-400 font-bold absolute left-3.5 top-3">@</span>

              {/* Status indicator */}
              <div className="absolute right-3.5 top-3.5">
                {usernameStatus.checking && (
                  <span className="text-[10px] text-slate-400 animate-pulse">Checking...</span>
                )}
                {!usernameStatus.checking && usernameStatus.available === true && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {!usernameStatus.checking && usernameStatus.available === false && (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            {usernameStatus.message && (
              <p
                className={`text-[11px] mt-1 ${
                  usernameStatus.available ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {usernameStatus.message}
              </p>
            )}
          </div>

          {/* Full Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Full Legal Name <span className="text-slate-500 normal-case">(Optional)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Vikram Sharma"
              className="w-full bg-[#0d121c] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80"
            />
          </div>

          {/* Date of Birth (Statutory >= 18) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Date of Birth <span className="text-slate-500 normal-case">(Enforces 18+)</span>
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-[#0d121c] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/80 [color-scheme:dark]"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    gender === g
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Complete registration */}
          <button
            onClick={handleSaveProfile}
            disabled={loading || !username || usernameStatus.available === false}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading || !username || usernameStatus.available === false
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Complete Setup & Enter Lobby</span>
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 text-center">
        <p className="text-[10px] text-slate-500">
          Strict Multi-Device Guard: Only 1 active session allowed at any given time.
        </p>
      </div>
    </div>
  );
};
