export type RoomStatus = 'WAITING' | 'COUNTDOWN' | 'FULL' | 'GUESSING' | 'REVEALING' | 'ENDED' | 'CANCELLED';

export interface RoomTierConfig {
  id: string;
  name: string;
  entryCoins: number;
  enabled: boolean;
  minPlayers: number;
  maxPlayers: number;
  winnerMultiplier: number;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  commissionFeePercent: number; // default 5%
  matchmakingDurationSec: number; // default 120
  guessingDurationSec: number; // default 120
  revealDurationSec: number; // default 10
  gracePeriodSec: number; // default 20
  qrReservationDurationMin: number; // default 10
  minAppVersion: string; // e.g. "1.0.4"
  latestAppVersion: string; // e.g. "1.0.4"
  telegramChannelUrl: string;
  apkDownloadUrl: string;
  cardAssets: {
    cardBack: string;
    jokerFace: string;
    nonJokerFace1: string;
    nonJokerFace2: string;
  };
  roomTiers: RoomTierConfig[];
}

export interface UserProfile {
  id: string;
  /** Immutable player-facing reference. Never use the mutable username as an account key. */
  accountId: string;
  email: string;
  username: string; // e.g. @player_one
  fullName?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  coins: number;
  isBanned: boolean;
  createdAt: string;
  lastActiveAt: string;
  activeSessionToken?: string;
  activeRoomId?: string | null;
}

export interface PlayerInRoom {
  userId: string;
  username: string;
  avatarSeed: string;
  joinedAt: string;
  selectedCard: number | null; // 1, 2, or 3
  isLocked: boolean;
  lockedAt: string | null;
  isDisconnected: boolean;
  disconnectExpiresAt?: string | null;
  isWinner?: boolean;
  payoutCoins?: number;
}

export interface GameRoom {
  id: string;
  tierId: string;
  tierName: string;
  entryCoins: number;
  status: RoomStatus;
  createdAt: string;
  countdownEndsAt: string | null;
  guessingEndsAt: string | null;
  revealEndsAt: string | null;
  jokerCard: number | null; // Selected during reveal phase
  players: PlayerInRoom[];
  winningMultiplier: number;
  endedAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: 'ADMIN' | 'SYSTEM' | null;
  /** A disclosed, audited operator decision. Null means the normal fair-selection flow was used. */
  operatorJokerCard?: number | null;
  operatorOverrideAt?: string | null;
}

export interface QRAccount {
  id: string;
  provider: 'PhonePe' | 'Paytm' | 'MobiKwik' | 'Custom UPI';
  upiId: string;
  accountHolder: string;
  dailyCap: number; // e.g. 50,000 INR
  utilizedToday: number;
  isActive: boolean;
  qrImageUrl: string;
  sessionStatus: 'ACTIVE' | 'RE-AUTH REQUIRED' | 'DISABLED';
}

export interface DepositReservation {
  id: string;
  userId: string;
  amount: number;
  qrAccountId: string;
  upiId: string;
  qrImageUrl: string;
  expiresAt: string;
  utr?: string;
  status: 'PENDING_PAYMENT' | 'UTR_SUBMITTED' | 'VERIFYING' | 'SUCCESS' | 'FAILED';
  verificationAttempts: number;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  requestedCoins: number;
  feeCoins: number; // 5%
  netPayoutInr: number;
  upiId: string;
  bankName: string;
  accountHolderName: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  bankUtr?: string;
  paidAt?: string;
  adminSourceBankCode?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  category: 'Deposit' | 'Withdrawal' | 'Game' | 'Other' | 'Self-Exclusion';
  referenceId?: string; // UTR or Room ID
  description: string;
  screenshotUrl?: string;
  attachmentType?: 'IMAGE' | 'PDF' | 'VIDEO';
  attachmentName?: string;
  attachmentData?: string; // Base64 data URL for uploaded image, pdf, or video
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  createdAt: string;
  replies: {
    from: 'USER' | 'ADMIN';
    message: string;
    timestamp: string;
  }[];
}

export interface FinancialAnalytics {
  platformNetProfit: number;
  gameMargin: number;
  withdrawalFeesCollected: number;
  grossDepositsInr: number;
  grossWithdrawalsPaidInr: number;
  totalPlayerLiability: number;
  activeGamesCount: number;
  pendingWithdrawalsCount: number;
  openTicketsCount: number;
  totalRegisteredUsers: number;
  tierPerformance: {
    tierId: string;
    tierName: string;
    entryCoins: number;
    gamesPlayed: number;
    turnoverCoins: number;
    payoutCoins: number;
    marginCoins: number;
  }[];
  qrUtilization: {
    accountId: string;
    provider: string;
    upiId: string;
    dailyCap: number;
    utilizedToday: number;
    status: string;
  }[];
  period?: string;
  periodStart?: string;
  periodEnd?: string;
}
