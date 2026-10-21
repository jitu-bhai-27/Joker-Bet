import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  FinancialAnalytics,
  GameRoom,
  QRAccount,
  SupportTicket,
  SystemConfig,
  UserProfile,
  WithdrawalRequest,
} from '../../types/index';
import {
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Tv,
  Sliders,
  Image as ImageIcon,
  QrCode,
  ArrowUpFromLine,
  Headphones,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  FileText,
  Video,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { setCurrentScreen, config, refreshConfig } = useApp();

  // Authentication
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    'ANALYTICS' | 'SECURITY' | 'ROOMS' | 'CONFIG' | 'ASSETS' | 'QR' | 'WITHDRAWALS' | 'SUPPORT' | 'USERS' | 'EMERGENCY'
  >('ANALYTICS');

  // Module data
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [qrAccounts, setQrAccounts] = useState<QRAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userQuery, setUserQuery] = useState('');

  // Config form state
  const [editConfig, setEditConfig] = useState<SystemConfig | null>(null);
  const [editAssets, setEditAssets] = useState<SystemConfig['cardAssets'] | null>(null);

  // Settlement modal
  const [settleWithdrawal, setSettleWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [settleUtr, setSettleUtr] = useState('');
  const [settleBankCode, setSettleBankCode] = useState('SBI_CORP_01');

  // Rejection modal
  const [rejectWithdrawal, setRejectWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('UPI VPA validation rejected by bank.');

  // Balance adjustment modal
  const [adjustUser, setAdjustUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustRemark, setAdjustRemark] = useState('');

  // Support reply
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<string>('RESOLVED');

  // Status banners
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Security & Anti-DDoS state
  const [securityData, setSecurityData] = useState<any>(null);
  const [simulatingAttack, setSimulatingAttack] = useState<string | null>(null);
  const [manualIpToBlock, setManualIpToBlock] = useState('');

  // Simulation controls
  const [simActive, setSimActive] = useState(false);
  const [simCount, setSimCount] = useState(1500);

  const handleAssetUpload = (asset: keyof SystemConfig['cardAssets'], file?: File) => {
    if (!file || !editAssets) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setAdminMsg({ type: 'error', text: 'Use an image file up to 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditAssets({ ...editAssets, [asset]: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const handleCancelRoom = async (roomId: string) => {
    try {
      const res = await api.cancelAdminRoom(roomId);
      setAdminMsg({ type: 'success', text: res.message });
      await loadAdminData();
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Room cancellation failed.' });
    }
  };

  const handleSetRoomJoker = async (roomId: string, jokerCard: number) => {
    try {
      const res = await api.setAdminRoomJoker(roomId, jokerCard);
      setAdminMsg({ type: 'success', text: res.message });
      await loadAdminData();
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Joker selection failed.' });
    }
  };

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.adminLogin(adminPass);
      if (res.success) {
        setIsAdminLoggedIn(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid passcode');
    }
  };

  // Fetch all admin data
  const loadAdminData = async () => {
    try {
      const [anRes, rmRes, qrRes, wdRes, tkRes, usRes, secRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminLiveRooms(),
        api.getAdminQrAccounts(),
        api.getAdminWithdrawals(),
        api.getAdminTickets(),
        api.getAdminUsers(userQuery),
        api.getSecurityStats().catch(() => ({ success: false })),
      ]);

      if (anRes.success) setAnalytics(anRes.analytics);
      if (rmRes.success) setLiveRooms(rmRes.rooms);
      if (qrRes.success) setQrAccounts(qrRes.accounts);
      if (wdRes.success) setWithdrawals(wdRes.withdrawals);
      if (tkRes.success) setSupportTickets(tkRes.tickets);
      if (usRes.success) setUsers(usRes.users);
      if (secRes.success) setSecurityData(secRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleSimulateAttack = async (type: 'DDOS_BURST' | 'AUTH_BRUTE_FORCE' | 'INJECTION_ATTEMPT' | 'TAMPERED_TRANSACTION') => {
    setSimulatingAttack(type);
    try {
      const res = await api.simulateAttack(type);
      setAdminMsg({ type: 'success', text: `🛡️ Defense Triggered: ${res.message}` });
      const sec = await api.getSecurityStats();
      if (sec.success) setSecurityData(sec);
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Simulation error' });
    } finally {
      setSimulatingAttack(null);
    }
  };

  const handleToggleIpBlock = async (ip: string, action: 'BLOCK' | 'UNBLOCK') => {
    try {
      const res = await api.toggleIpBlock(ip, action);
      setAdminMsg({ type: 'success', text: res.message });
      setManualIpToBlock('');
      const sec = await api.getSecurityStats();
      if (sec.success) setSecurityData(sec);
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAdminData();
      const interval = setInterval(loadAdminData, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdminLoggedIn, userQuery]);

  useEffect(() => {
    if (config) {
      setEditConfig(JSON.parse(JSON.stringify(config)));
      setEditAssets(JSON.parse(JSON.stringify(config.cardAssets)));
    }
  }, [config]);

  // Save Config
  const handleSaveConfig = async () => {
    if (!editConfig) return;
    setLoading(true);
    try {
      const res = await api.updateAdminConfig(editConfig);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        await refreshConfig();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Failed to update config' });
    } finally {
      setLoading(false);
    }
  };

  // Save Card Assets
  const handleSaveAssets = async () => {
    if (!editAssets) return;
    setLoading(true);
    try {
      const res = await api.updateCardAssets(editAssets);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        await refreshConfig();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Failed to update assets' });
    } finally {
      setLoading(false);
    }
  };

  // Approve Withdrawal
  const handleApproveWithdrawal = async () => {
    if (!settleWithdrawal || !settleUtr.trim()) return;
    setLoading(true);
    try {
      const res = await api.approveWithdrawal(settleWithdrawal.id, settleUtr.trim(), settleBankCode);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        setSettleWithdrawal(null);
        setSettleUtr('');
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Failed to approve' });
    } finally {
      setLoading(false);
    }
  };

  // Reject Withdrawal (100% Auto-Refund)
  const handleRejectWithdrawal = async () => {
    if (!rejectWithdrawal) return;
    setLoading(true);
    try {
      const res = await api.rejectWithdrawal(rejectWithdrawal.id, rejectionReason);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        setRejectWithdrawal(null);
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Failed to reject' });
    } finally {
      setLoading(false);
    }
  };

  // Balance Adjustment
  const handleBalanceAdjustment = async () => {
    if (!adjustUser || !adjustRemark.trim()) return;
    setLoading(true);
    try {
      const res = await api.adjustUserBalance(adjustUser.id, adjustAmount, adjustRemark.trim());
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        setAdjustUser(null);
        setAdjustAmount(0);
        setAdjustRemark('');
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message || 'Failed to adjust' });
    } finally {
      setLoading(false);
    }
  };

  // Ban/Unban user
  const handleToggleBan = async (userId: string) => {
    try {
      const res = await api.toggleUserBan(userId);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message });
    }
  };

  // Send Support Reply
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setLoading(true);
    try {
      const res = await api.replyTicket(selectedTicket.id, replyText.trim(), replyStatus);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        setSelectedTicket(null);
        setReplyText('');
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Emergency Maintenance Hard Stop
  const handleToggleMaintenance = async (enabled: boolean) => {
    try {
      const res = await api.toggleMaintenance(enabled);
      if (res.success) {
        setAdminMsg({ type: 'success', text: res.message });
        await refreshConfig();
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message });
    }
  };

  // Toggle High Traffic Simulation
  const handleToggleSimulation = async (enabled: boolean) => {
    try {
      const res = await api.toggleSimulation(enabled, simCount);
      if (res.success) {
        setSimActive(res.simulatedTrafficActive);
        setAdminMsg({ type: 'success', text: res.message });
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminMsg({ type: 'error', text: err.message });
    }
  };

  // If not authenticated, render login gateway
  if (!isAdminLoggedIn) {
    return (
      <div className="w-full min-h-[620px] sm:min-h-[750px] flex items-center justify-center p-4 sm:p-6 bg-[#07090e] select-none">
        <div className="max-w-md w-full bg-[#0d121c] border border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 mx-auto flex items-center justify-center text-2xl shadow-lg mb-4 text-black">
            🛡️
          </div>
          <h2 className="text-2xl font-black text-center text-white font-['Cinzel']">
            Master Admin Desk
          </h2>
          <p className="text-xs text-center text-slate-400 mt-1 mb-6">
            Protected real-time administrative state engine and financial audit ledger
          </p>

          {authError && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Master Passcode
              </label>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Enter admin passcode (Default: admin)"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition-all"
            >
              Authenticate & Open Admin Desk
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('LOBBY')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 pt-2"
            >
              Return to Player App
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col select-none">
      {/* Top Admin Sub-bar */}
      <div className="bg-[#0b0e17] border-b border-amber-500/30 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center font-black text-black">
            🛡️
          </div>
          <div>
            <div className="text-sm font-black text-white font-['Cinzel'] flex items-center gap-2">
              <span className="truncate">MASTER ADMIN ENGINE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Base Parity: 1 Coin = ₹1.00 INR • Zero-Loss Mathematical Safeguards
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] sm:flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentScreen('LOBBY')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] sm:text-xs font-bold whitespace-nowrap"
          >
            ← Return to Website
          </button>
          <button
            onClick={() => setIsAdminLoggedIn(false)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] sm:text-xs font-bold whitespace-nowrap"
          >
            Lock Admin Portal
          </button>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="admin-tabs bg-[#0a0d16] border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
        {[
          { id: 'ANALYTICS', label: 'Financial Analytics', icon: BarChart3 },
          { id: 'SECURITY', label: 'Anti-DDoS Firewall', icon: ShieldCheck },
          { id: 'ROOMS', label: 'Live Room Monitor', icon: Tv },
          { id: 'CONFIG', label: 'Tiers & Timers', icon: Sliders },
          { id: 'ASSETS', label: 'Card Artworks', icon: ImageIcon },
          { id: 'QR', label: 'UPI Merchant Gateways', icon: QrCode },
          { id: 'WITHDRAWALS', label: `Withdrawals (${withdrawals.filter((w) => w.status === 'PENDING').length})`, icon: ArrowUpFromLine },
          { id: 'SUPPORT', label: `Support Desk (${supportTickets.filter((t) => t.status === 'OPEN').length})`, icon: Headphones },
          { id: 'USERS', label: 'User Ledger', icon: Users },
          { id: 'EMERGENCY', label: 'Emergency Controls', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {adminMsg && (
        <div
          className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between text-xs ${
            adminMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{adminMsg.text}</span>
          <button onClick={() => setAdminMsg(null)} className="font-bold text-slate-400 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Admin Workspace Area */}
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* =================================================================== */}
        {/* 1. FINANCIAL ANALYTICS & REVENUE ACCOUNTING DASHBOARD */}
        {/* =================================================================== */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">
                Financial Analytics & Revenue KPI Dashboard
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Net Profit = Game Margin (Turnover - 2x Payouts) + Cumulative 5% Withdrawal Fees
              </p>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-[#0d121c] border border-amber-500/40">
                <div className="text-[10px] uppercase font-bold text-slate-400">Platform Net Profit</div>
                <div className="text-xl font-black text-amber-300 font-mono mt-1">
                  ₹{analytics?.platformNetProfit?.toLocaleString() || 0}
                </div>
                <div className="text-[9px] text-emerald-400 mt-0.5">House Margin + 5% Fees</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Game Margin</div>
                <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                  ₹{analytics?.gameMargin?.toLocaleString() || 0}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Zero-Loss Protection</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">5% Withdrawal Fees</div>
                <div className="text-xl font-black text-amber-200 font-mono mt-1">
                  ₹{analytics?.withdrawalFeesCollected?.toLocaleString() || 0}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Retained Revenue</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Gross Deposits</div>
                <div className="text-xl font-black text-sky-300 font-mono mt-1">
                  ₹{analytics?.grossDepositsInr?.toLocaleString() || 0}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Verified Incoming</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Gross Withdrawals</div>
                <div className="text-xl font-black text-slate-300 font-mono mt-1">
                  ₹{analytics?.grossWithdrawalsPaidInr?.toLocaleString() || 0}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Manual Bank Paid</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Player Liability</div>
                <div className="text-xl font-black text-yellow-300 font-mono mt-1">
                  ₹{analytics?.totalPlayerLiability?.toLocaleString() || 0}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Circulating Coins</div>
              </div>
            </div>

            {/* Tier-Wise Game Volume & Margin Ledger */}
            <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Tier-Wise Performance & Turnover Ledger</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07090e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Room Tier</th>
                      <th className="py-2.5 px-3">Entry Coins</th>
                      <th className="py-2.5 px-3">Rounds Played</th>
                      <th className="py-2.5 px-3">Turnover Coins</th>
                      <th className="py-2.5 px-3">Payout Coins (2x)</th>
                      <th className="py-2.5 px-3">Net House Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {analytics?.tierPerformance?.map((tp) => (
                      <tr key={tp.tierId} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-bold text-white">{tp.tierName}</td>
                        <td className="py-2.5 px-3 font-mono text-amber-300">{tp.entryCoins} Coins</td>
                        <td className="py-2.5 px-3 font-mono">{tp.gamesPlayed}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {tp.turnoverCoins.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {tp.payoutCoins.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          +{tp.marginCoins.toLocaleString()} Coins
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QR Daily Cap Utilization Ledger */}
            <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Multi-Account QR Daily Limit Utilization</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analytics?.qrUtilization?.map((q) => {
                  const percent = Math.min(100, Math.round((q.utilizedToday / q.dailyCap) * 100));
                  return (
                    <div key={q.accountId} className="p-3 rounded-xl bg-[#070a12] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{q.provider}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          {q.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">{q.upiId}</div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Utilized: ₹{q.utilizedToday.toLocaleString()}</span>
                        <span>Cap: ₹{q.dailyCap.toLocaleString()} ({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ANTI-DDOS FIREWALL & CYBER DEFENSE NOC */}
        {/* =================================================================== */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-white font-['Cinzel'] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  <span>Anti-DDoS Firewall & Zero-Trust Cyber Defense</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time Layer 7 volumetric mitigation, anti-injection filters, and live threat neutralization sandbox
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>SHIELD: ACTIVE</span>
                </span>
              </div>
            </div>

            {/* Security KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#0d121c] border border-emerald-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Firewall Engine</div>
                <div className="text-xl font-black text-emerald-300 font-mono flex items-center gap-2">
                  <span>ACTIVE</span>
                </div>
                <div className="text-[9px] text-emerald-400/80">Sliding Window Limiter</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Attacks Blocked</div>
                <div className="text-xl font-black text-rose-400 font-mono">
                  {securityData?.metrics?.blockedAttacksCount ?? 0}
                </div>
                <div className="text-[9px] text-slate-500">Volumetric & Injections</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Requests Filtered</div>
                <div className="text-xl font-black text-sky-300 font-mono">
                  {securityData?.metrics?.totalRequestsFiltered ?? 0}
                </div>
                <div className="text-[9px] text-slate-500">120 req / 15s Per Client</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Quarantined IPs</div>
                <div className="text-xl font-black text-amber-300 font-mono">
                  {securityData?.metrics?.activeBlockedIps ?? 0}
                </div>
                <div className="text-[9px] text-slate-500">Blacklisted / In Jail</div>
              </div>
            </div>

            {/* Interactive Attack Simulation Sandbox */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d111c] via-[#0e1424] to-[#0a0e18] border border-amber-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Live Cyber Attack Simulation & Defense Sandbox</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Test the platform&apos;s active defense mechanisms against common malicious exploitation techniques in real time:
                  </p>
                </div>
                {simulatingAttack && (
                  <span className="text-xs font-mono text-amber-400 animate-pulse font-bold">
                    Simulating Attack...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                <button
                  disabled={loading || !!simulatingAttack}
                  onClick={() => handleSimulateAttack('DDOS_BURST')}
                  className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-red-500/30 text-left space-y-1 hover:border-red-400 transition-all disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 group-hover:text-red-300">
                      ⚡ Volumetric DDoS Burst
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                      Test
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Simulates 350 req/sec packet flood; verifies Layer 7 Sliding Window auto-quarantine.
                  </div>
                </button>

                <button
                  disabled={loading || !!simulatingAttack}
                  onClick={() => handleSimulateAttack('AUTH_BRUTE_FORCE')}
                  className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-left space-y-1 hover:border-amber-400 transition-all disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                      🔐 Brute-Force Credential Stuffing
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Test
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Simulates rapid invalid OTP attempts; verifies 6/min lock and exponential cooldown.
                  </div>
                </button>

                <button
                  disabled={loading || !!simulatingAttack}
                  onClick={() => handleSimulateAttack('INJECTION_ATTEMPT')}
                  className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-purple-500/30 text-left space-y-1 hover:border-purple-400 transition-all disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300">
                      💉 SQL / XSS Script Injection
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      Test
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Injects malicious AST payload into UTR inputs; verifies deep sanitization AST drop.
                  </div>
                </button>

                <button
                  disabled={loading || !!simulatingAttack}
                  onClick={() => handleSimulateAttack('TAMPERED_TRANSACTION')}
                  className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-500/30 text-left space-y-1 hover:border-emerald-400 transition-all disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                      💰 Negative Balance Tampering
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      Test
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Injects negative coins payload (-5000); verifies strict integer guardrail drop.
                  </div>
                </button>
              </div>
            </div>

            {/* Live Security Incidents Table */}
            <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Real-Time Security Threat Incident Log</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  Auto-updating feed • Retains last 50 incidents
                </span>
              </div>

              {securityData?.metrics?.recentIncidents && securityData.metrics.recentIncidents.length > 0 ? (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#070a12] text-slate-400 uppercase text-[10px] border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Threat Type</th>
                        <th className="py-2.5 px-3">Origin IP</th>
                        <th className="py-2.5 px-3">Target Endpoint</th>
                        <th className="py-2.5 px-3">Technical Details</th>
                        <th className="py-2.5 px-3">Action Taken</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                      {securityData.metrics.recentIncidents.map((incident: any) => (
                        <tr key={incident.id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(incident.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                incident.type === 'DDOS_BURST'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : incident.type === 'AUTH_BRUTE_FORCE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : incident.type === 'INJECTION_ATTEMPT'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {incident.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-amber-300 whitespace-nowrap">{incident.ip}</td>
                          <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{incident.path}</td>
                          <td className="py-2 px-3 text-slate-400 font-sans text-xs max-w-xs truncate">
                            {incident.details}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              {incident.actionTaken}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 bg-[#07090e] rounded-xl border border-slate-800/80">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                  No threat incidents recorded yet. System firewall is actively monitoring all traffic.
                </div>
              )}
            </div>

            {/* Manual IP Blacklist / Whitelist Firewall Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Manual IP Firewall Rule Configuration</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Manually ban abusive IPs or unban false-positives instantly across all server clusters:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualIpToBlock}
                    onChange={(e) => setManualIpToBlock(e.target.value)}
                    placeholder="Enter IP (e.g. 192.168.1.100)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => manualIpToBlock && handleToggleIpBlock(manualIpToBlock.trim(), 'BLOCK')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Block IP
                  </button>
                  <button
                    onClick={() => manualIpToBlock && handleToggleIpBlock(manualIpToBlock.trim(), 'UNBLOCK')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                  >
                    Unblock IP
                  </button>
                </div>

                {securityData?.metrics?.blockedIpsList && securityData.metrics.blockedIpsList.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-300 mb-1.5">Currently Blacklisted IPs:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {securityData.metrics.blockedIpsList.map((ip: string) => (
                        <span
                          key={ip}
                          className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-[11px] flex items-center gap-1.5"
                        >
                          <span>{ip}</span>
                          <button
                            onClick={() => handleToggleIpBlock(ip, 'UNBLOCK')}
                            className="hover:text-white font-bold ml-1"
                            title="Remove from blacklist"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Zero-Loss Mathematical Proof Card */}
              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Zero-Loss Mathematical Integrity Safeguards</span>
                </h4>

                <div className="p-3 rounded-xl bg-[#070a12] border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-amber-300">Mathematical Guarantee:</strong> Maximum allowed winners is strictly clamped to:
                  </p>
                  <div className="p-2 rounded bg-black/60 font-mono text-center text-amber-200 font-bold border border-amber-500/20">
                    Max Allowed Winners = floor(Total Players / 2.0)
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>3 Players: Max 1 Winner (2 lose → House retains 1 entry fee).</li>
                    <li>4 Players: Max 2 Winners (2 win = 4x → Break-even).</li>
                    <li>Cards chosen by &gt; 50% of players are <em>NEVER</em> assigned as Joker.</li>
                    <li>Protects the platform from bankrupting syndicates or coordinated bots.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. LIVE REAL-TIME ROOM MONITOR */}
        {/* =================================================================== */}
        {activeTab === 'ROOMS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white font-['Cinzel']">Live Room Monitor</h3>
                <p className="text-xs text-slate-400">
                  Real-time observation of all tables across tiers, countdowns, and secret picks
                </p>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                Active Tables: {liveRooms.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveRooms.map((room) => (
                <div key={room.id} className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{room.tierName}</span>
                      <div className="text-[10px] text-amber-400 font-mono">{room.entryCoins} Coins Entry</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">ID: {room.id}</div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        room.status === 'GUESSING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : room.status === 'REVEALING'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 border-t border-b border-slate-800 py-1.5 font-mono">
                    <span>Players: {room.playersCount} / 10</span>
                    <span>Locked: {room.lockedCount}</span>
                    <span>Joker: #{room.jokerCard || '?'}</span>
                  </div>
                  <div className="rounded-lg bg-[#07090e] border border-slate-800 px-2.5 py-2 text-[11px] font-mono text-amber-300 flex justify-between">
                    <span>Timer</span>
                    <span>{room.remainingSeconds === null ? '—' : `00:${String(room.remainingSeconds).padStart(2, '0')}`}</span>
                  </div>

                  {/* Player usernames */}
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px]">
                    {room.players.map((p: any) => (
                      <div key={p.userId} className="flex justify-between text-slate-300">
                        <span>{p.username}</span>
                        <span className="font-mono text-slate-400">
                          {p.isLocked ? `Card #${p.selectedCard} (Locked)` : 'Picking...'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[1, 2, 3].map((card) => (
                      <button
                        key={card}
                        disabled={room.status !== 'GUESSING'}
                        onClick={() => handleSetRoomJoker(room.id, card)}
                        className="py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-300 disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        Joker #{card}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCancelRoom(room.id)}
                    className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] font-bold"
                  >
                    Cancel Room & Refund Players
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. DYNAMIC CONFIGURATOR */}
        {/* =================================================================== */}
        {activeTab === 'CONFIG' && editConfig && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">
                Dynamic Room & Timer Configurator (Zero Hardcoding)
              </h3>
              <p className="text-xs text-slate-400">
                Modifications broadcast instantly across all workers and rooms without server restarts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase">Economic Rules</div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Platform Commission Fee (%)</label>
                  <input
                    type="number"
                    value={editConfig.commissionFeePercent}
                    onChange={(e) =>
                      setEditConfig({ ...editConfig, commissionFeePercent: Number(e.target.value) })
                    }
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Minimum Deposit (Coins)</label>
                  <input
                    type="number"
                    value={editConfig.minDeposit}
                    onChange={(e) => setEditConfig({ ...editConfig, minDeposit: Number(e.target.value) })}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Minimum Withdrawal (Coins)</label>
                  <input
                    type="number"
                    value={editConfig.minWithdrawal}
                    onChange={(e) => setEditConfig({ ...editConfig, minWithdrawal: Number(e.target.value) })}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase">Real-Time Room Timers</div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Matchmaking Countdown (Sec)</label>
                  <input
                    type="number"
                    value={editConfig.matchmakingDurationSec}
                    onChange={(e) =>
                      setEditConfig({ ...editConfig, matchmakingDurationSec: Number(e.target.value) })
                    }
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">In-Game Guessing Duration (Sec)</label>
                  <input
                    type="number"
                    value={editConfig.guessingDurationSec}
                    onChange={(e) =>
                      setEditConfig({ ...editConfig, guessingDurationSec: Number(e.target.value) })
                    }
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Final Reveal Countdown (Sec)</label>
                  <input
                    type="number"
                    value={editConfig.revealDurationSec}
                    onChange={(e) =>
                      setEditConfig({ ...editConfig, revealDurationSec: Number(e.target.value) })
                    }
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase">Save Dynamic State</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clicking save pushes updates to active sockets, timers, and active room tickers immediately.
                </p>
                <button
                  onClick={handleSaveConfig}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-lg"
                >
                  {loading ? 'Saving...' : 'Deploy Dynamic Configurations'}
                </button>
              </div>
            </div>

            {/* Room Tiers Toggle & Values */}
            <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-amber-300 uppercase">Active Room Tiers (8 Tiers)</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {editConfig.roomTiers.map((tier, idx) => (
                  <div key={tier.id} className="p-3 rounded-xl bg-[#07090e] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{tier.name}</span>
                      <input
                        type="checkbox"
                        checked={tier.enabled}
                        onChange={(e) => {
                          const updated = [...editConfig.roomTiers];
                          updated[idx].enabled = e.target.checked;
                          setEditConfig({ ...editConfig, roomTiers: updated });
                        }}
                        className="rounded text-amber-500 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Entry Coins</label>
                      <input
                        type="number"
                        value={tier.entryCoins}
                        onChange={(e) => {
                          const updated = [...editConfig.roomTiers];
                          updated[idx].entryCoins = Number(e.target.value);
                          setEditConfig({ ...editConfig, roomTiers: updated });
                        }}
                        className="w-full bg-[#0d121c] border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. CARD GRAPHICS & ASSET MANAGER */}
        {/* =================================================================== */}
        {activeTab === 'ASSETS' && editAssets && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">
                Card Graphics & Asset Manager
              </h3>
              <p className="text-xs text-slate-400">
                Set custom URLs for Card Back, Joker Face, and 2 Non-Joker Faces rendered on the 3D table
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-amber-300 uppercase">Card Back Artwork</label>
                <input
                  type="text"
                  value={editAssets.cardBack}
                  onChange={(e) => setEditAssets({ ...editAssets, cardBack: e.target.value })}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <img
                  src={editAssets.cardBack}
                  alt="Back Preview"
                  className="w-32 h-44 object-cover rounded-xl border border-slate-700 shadow-md"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-amber-300 uppercase">Winning Joker Face</label>
                <input
                  type="text"
                  value={editAssets.jokerFace}
                  onChange={(e) => setEditAssets({ ...editAssets, jokerFace: e.target.value })}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <img
                  src={editAssets.jokerFace}
                  alt="Joker Preview"
                  className="w-32 h-44 object-cover rounded-xl border border-amber-500 shadow-md"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase">Non-Joker Face 1</label>
                <input
                  type="text"
                  value={editAssets.nonJokerFace1}
                  onChange={(e) => setEditAssets({ ...editAssets, nonJokerFace1: e.target.value })}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <img
                  src={editAssets.nonJokerFace1}
                  alt="Face 1 Preview"
                  className="w-32 h-44 object-cover rounded-xl border border-slate-700"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase">Non-Joker Face 2</label>
                <input
                  type="text"
                  value={editAssets.nonJokerFace2}
                  onChange={(e) => setEditAssets({ ...editAssets, nonJokerFace2: e.target.value })}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <img
                  src={editAssets.nonJokerFace2}
                  alt="Face 2 Preview"
                  className="w-32 h-44 object-cover rounded-xl border border-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleSaveAssets}
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-xs rounded-xl shadow-lg"
            >
              {loading ? 'Saving Assets...' : 'Save & Sync Card Graphic Assets'}
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. WITHDRAWAL QUEUE MANAGER */}
        {/* =================================================================== */}
        {activeTab === 'WITHDRAWALS' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">Withdrawal Queue Manager</h3>
              <p className="text-xs text-slate-400">
                Manual bank transfer verification queue. Settling logs bank UTR; rejecting triggers 100% auto-refund to player wallet.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-[#0c101b] rounded-2xl border border-slate-800">
                <thead className="bg-[#07090e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Player Handle</th>
                    <th className="py-3 px-4">Coins Requested</th>
                    <th className="py-3 px-4">5% Fee</th>
                    <th className="py-3 px-4">Net Payout (INR)</th>
                    <th className="py-3 px-4">Destination Bank / UPI</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 font-bold text-white">{w.username}</td>
                      <td className="py-3 px-4 font-mono">{w.requestedCoins}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{w.feeCoins}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{w.netPayoutInr}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-200">{w.upiId}</div>
                        <div className="text-[10px] text-slate-400">{w.accountHolderName} ({w.bankName})</div>
                      </td>
                      <td className="py-3 px-4">
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
                      </td>
                      <td className="py-3 px-4 text-right">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSettleWithdrawal(w);
                                setSettleUtr(`SBI${Date.now().toString().substring(6)}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] shadow-sm"
                            >
                              Settle & Paid
                            </button>
                            <button
                              onClick={() => setRejectWithdrawal(w)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-[11px]"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. CUSTOMER SUPPORT DESK */}
        {/* =================================================================== */}
        {activeTab === 'SUPPORT' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">Customer Support Desk Inbox</h3>
              <p className="text-xs text-slate-400">
                Resolve user payment queries, inspect screenshots, and reply to threads in real time
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportTickets.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#0c101b] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-300 text-xs">
                        {t.username} • [{t.category}]
                      </span>
                      {t.referenceId && (
                        <div className="text-[10px] text-slate-400 font-mono">Ref: #{t.referenceId}</div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-yellow-500/10 text-yellow-300'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-[#07090e] p-3 rounded-xl border border-slate-800/80">
                    {t.description}
                  </p>

                  {(t.attachmentData || t.screenshotUrl) && (
                    <div className="p-2.5 rounded-xl bg-[#07090e] border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {t.attachmentType === 'PDF' ? (
                          <FileText className="w-4 h-4 text-red-400" />
                        ) : t.attachmentType === 'VIDEO' ? (
                          <Video className="w-4 h-4 text-sky-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">
                          {t.attachmentName || 'Attachment File'}
                        </span>
                      </div>
                      <a
                        href={t.attachmentData || t.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline"
                      >
                        Inspect {t.attachmentType || 'File'}
                      </a>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedTicket(t)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
                  >
                    Reply to Ticket
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 7. USER ACCOUNT & LEDGER MANAGER */}
        {/* =================================================================== */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white font-['Cinzel']">User Account & Ledger Manager</h3>
                <p className="text-xs text-slate-400">
                  Search users, adjust coin balances with mandatory audit remarks, and toggle ban status
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search @username or email..."
                  className="bg-[#0c101b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white pl-8 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-[#0c101b] rounded-2xl border border-slate-800">
                <thead className="bg-[#07090e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Handle</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Coin Balance</th>
                    <th className="py-3 px-4">Active Room</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 font-bold text-white">{u.username || 'Unset'}</td>
                      <td className="py-3 px-4 text-slate-400">{u.email}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">{u.coins} Coins</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{u.activeRoomId || 'In Lobby'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isBanned
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {u.isBanned ? 'BANNED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setAdjustUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold"
                        >
                          Adjust Coins
                        </button>
                        <button
                          onClick={() => handleToggleBan(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            u.isBanned
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 8. EMERGENCY CONTROLS & HIGH-TRAFFIC SIMULATION */}
        {/* =================================================================== */}
        {activeTab === 'EMERGENCY' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-white font-['Cinzel']">
                System Emergency Controls & Concurrency Engine
              </h3>
              <p className="text-xs text-slate-400">
                Global emergency hard stop with 100% refund automation and 1,000–10,000 player traffic simulation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Maintenance Hard Stop */}
              <div className="p-5 rounded-2xl bg-[#0c101b] border border-red-500/40 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Global Maintenance Mode (Hard Stop)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Activating Maintenance Mode immediately freezes all ongoing games and waiting rooms.
                  <strong className="text-amber-300 block mt-1">
                    ⚡ Guaranteed 100% Refunds: Every player in every active table has their entry fee instantly refunded to their wallet balance.
                  </strong>
                </p>

                <div className="pt-2">
                  {config?.maintenanceMode ? (
                    <button
                      onClick={() => handleToggleMaintenance(false)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
                    >
                      Turn Maintenance OFF & Resume Platform
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleMaintenance(true)}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg"
                    >
                      Activate Emergency Hard Stop (Refund All Tables)
                    </button>
                  )}
                </div>
              </div>

              {/* High Traffic Simulation Engine */}
              <div className="p-5 rounded-2xl bg-[#0c101b] border border-cyan-500/40 space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Activity className="w-5 h-5" />
                  <span>High-Traffic Concurrency Engine (1,000 - 10,000 Players)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Demonstrate the platform handling massive concurrent players across all 8 tiers with automatic room scaling, state ticker loops, and zero-loss calculations.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={simCount}
                    onChange={(e) => setSimCount(Number(e.target.value))}
                    className="w-32 bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 font-bold"
                  />
                  <span className="text-xs text-slate-400">Simulated Players Pool</span>
                </div>

                <button
                  onClick={() => handleToggleSimulation(!simActive)}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
                    simActive
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {simActive ? 'Stop Traffic Simulation' : 'Launch High-Traffic Pulse (Scale to 10k)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settle Withdrawal Modal */}
      {settleWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d121c] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Cinzel']">
              Settle Withdrawal Payout
            </h3>
            <div className="text-xs text-slate-300 space-y-1 bg-[#07090e] p-3 rounded-xl border border-slate-800">
              <div>Player: <strong>{settleWithdrawal.username}</strong></div>
              <div>Net Transfer Amount: <strong className="text-emerald-400">₹{settleWithdrawal.netPayoutInr}</strong></div>
              <div>Destination UPI/Bank: <span className="font-mono">{settleWithdrawal.upiId}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">12-Digit Bank Settlement UTR</label>
              <input
                type="text"
                value={settleUtr}
                onChange={(e) => setSettleUtr(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Source Bank Account Code</label>
              <input
                type="text"
                value={settleBankCode}
                onChange={(e) => setSettleBankCode(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSettleWithdrawal(null)}
                className="flex-1 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveWithdrawal}
                disabled={loading || !settleUtr.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md"
              >
                {loading ? 'Confirming...' : 'Mark as Settled / Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal (Auto 100% Refund) */}
      {rejectWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d121c] border border-red-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Cinzel']">
              Reject Withdrawal & Auto-Refund
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              100% of <strong className="text-amber-300">{rejectWithdrawal.requestedCoins} Coins</strong> will be refunded to {rejectWithdrawal.username}&apos;s wallet balance immediately.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rejection Reason Remark</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectWithdrawal(null)}
                className="flex-1 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithdrawal}
                disabled={loading}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md"
              >
                {loading ? 'Refunding...' : 'Confirm Rejection & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Coins Modal */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d121c] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Cinzel']">
              Adjust User Balance: {adjustUser.username}
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Coin Delta (+ or -)</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-amber-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mandatory Audit Remark</label>
              <input
                type="text"
                value={adjustRemark}
                onChange={(e) => setAdjustRemark(e.target.value)}
                placeholder="e.g. Compensation for payment gateway delay #4081"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAdjustUser(null)}
                className="flex-1 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjustment}
                disabled={loading || !adjustRemark.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-md"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d121c] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Cinzel']">
              Reply to Support Ticket: {selectedTicket.username}
            </h3>
            <p className="text-xs text-slate-400 bg-[#07090e] p-2.5 rounded-xl border border-slate-800">
              {selectedTicket.description}
            </p>

            {(selectedTicket.attachmentData || selectedTicket.screenshotUrl) && (
              <div className="p-2.5 rounded-xl bg-[#07090e] border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300 text-[11px] truncate">
                  {selectedTicket.attachmentName || 'Supporting Proof'} ({selectedTicket.attachmentType || 'Media'})
                </span>
                <a
                  href={selectedTicket.attachmentData || selectedTicket.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline"
                >
                  View Attachment
                </a>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Admin Reply Message</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type resolution or verification note..."
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Ticket Status</label>
              <select
                value={replyStatus}
                onChange={(e) => setReplyStatus(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="RESOLVED">RESOLVED</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="OPEN">OPEN</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={loading || !replyText.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-md"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
