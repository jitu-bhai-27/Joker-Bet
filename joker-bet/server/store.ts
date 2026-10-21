import {
  GameRoom,
  PlayerInRoom,
  QRAccount,
  DepositReservation,
  WithdrawalRequest,
  SupportTicket,
  SystemConfig,
  UserProfile,
  FinancialAnalytics,
} from '../src/types/index';

class AppStore {
  public config: SystemConfig = {
    maintenanceMode: false,
    minDeposit: 10,
    maxDeposit: 100000,
    minWithdrawal: 100,
    maxWithdrawal: 100000,
    commissionFeePercent: 5,
    matchmakingDurationSec: 120,
    guessingDurationSec: 120,
    revealDurationSec: 10,
    gracePeriodSec: 25,
    qrReservationDurationMin: 10,
    minAppVersion: '1.0.4',
    latestAppVersion: '1.0.4',
    telegramChannelUrl: 'https://t.me/JokerBetOfficial',
    apkDownloadUrl: '/api/download/apk',
    cardAssets: {
      cardBack: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
      jokerFace: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
      nonJokerFace1: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      nonJokerFace2: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    },
    roomTiers: [
      { id: 'tier_10', name: 'Bronze Novice', entryCoins: 10, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_50', name: 'Silver Starter', entryCoins: 50, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_100', name: 'Gold Classic', entryCoins: 100, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_200', name: 'Platinum Pro', entryCoins: 200, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_300', name: 'Diamond Ace', entryCoins: 300, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_500', name: 'Ruby Elite', entryCoins: 500, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_700', name: 'Crown Master', entryCoins: 700, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
      { id: 'tier_1000', name: 'Royal High-Roller', entryCoins: 1000, enabled: true, minPlayers: 3, maxPlayers: 10, winnerMultiplier: 2.0 },
    ],
  };

  public users = new Map<string, UserProfile>(); // userId -> UserProfile
  public sessions = new Map<string, { userId: string; lastSeen: number }>(); // token -> session
  public userActiveToken = new Map<string, string>(); // userId -> token (Single active session rule)
  public otpStore = new Map<string, { otp: string; expiresAt: number; lastSentAt: number }>();

  public rooms = new Map<string, GameRoom>(); // roomId -> GameRoom
  /** Completed and cancelled rooms remain queryable for player and operator audit history. */
  public roomHistory = new Map<string, GameRoom>();
  public qrAccounts = new Map<string, QRAccount>();
  public reservations = new Map<string, DepositReservation>();
  public withdrawals = new Map<string, WithdrawalRequest>();
  public supportTickets = new Map<string, SupportTicket>();

  // Financial tracking
  public gameMarginsTotal = 0;
  public withdrawalFeesTotal = 0;
  public grossDepositsInr = 0;
  public grossWithdrawalsPaidInr = 0;
  public tierHistory = new Map<string, { gamesPlayed: number; turnoverCoins: number; payoutCoins: number; marginCoins: number }>();

  // High traffic simulation toggle
  public simulatedTrafficActive = false;
  public simulatedPlayerCount = 1250;

  constructor() {
    this.seedInitialData();
    this.startServerTicker();
  }

  private seedInitialData() {
    // Seed QR accounts
    const initialQRs: QRAccount[] = [
      {
        id: 'qr_phonepe_primary',
        provider: 'PhonePe',
        upiId: 'jokerbet.merchant@ybl',
        accountHolder: 'Joker Bet Gaming Services',
        dailyCap: 50000,
        utilizedToday: 14200,
        isActive: true,
        qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=jokerbet.merchant@ybl&pn=JokerBet&cu=INR',
        sessionStatus: 'ACTIVE',
      },
      {
        id: 'qr_paytm_reserve',
        provider: 'Paytm',
        upiId: 'jokerbet.corp@paytm',
        accountHolder: 'Joker Bet Corp Pvt Ltd',
        dailyCap: 100000,
        utilizedToday: 28500,
        isActive: true,
        qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=jokerbet.corp@paytm&pn=JokerBet&cu=INR',
        sessionStatus: 'ACTIVE',
      },
      {
        id: 'qr_mobikwik_express',
        provider: 'MobiKwik',
        upiId: 'jokerbet.express@ikwik',
        accountHolder: 'Joker Bet Express Operations',
        dailyCap: 50000,
        utilizedToday: 9100,
        isActive: true,
        qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=jokerbet.express@ikwik&pn=JokerBet&cu=INR',
        sessionStatus: 'ACTIVE',
      },
    ];
    for (const qr of initialQRs) {
      this.qrAccounts.set(qr.id, qr);
    }

    // Seed Tier History
    for (const tier of this.config.roomTiers) {
      this.tierHistory.set(tier.id, {
        gamesPlayed: Math.floor(Math.random() * 40) + 10,
        turnoverCoins: Math.floor(Math.random() * 50000) + 5000,
        payoutCoins: Math.floor(Math.random() * 45000) + 4000,
        marginCoins: Math.floor(Math.random() * 5000) + 1000,
      });
    }

    // Seed Demo User
    const demoUser: UserProfile = {
      id: 'usr_demo_vip',
      accountId: 'JB-000001',
      email: 'player@jokerbet.com',
      username: '@royal_joker',
      fullName: 'Vikramaditya Rao',
      dob: '1998-05-14',
      gender: 'Male',
      coins: 2500, // starting balance for immediate smooth testing
      isBanned: false,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      activeRoomId: null,
    };
    this.users.set(demoUser.id, demoUser);

    // Initial Withdrawal requests
    const initialWithdrawal: WithdrawalRequest = {
      id: 'wdr_sample_01',
      userId: demoUser.id,
      username: demoUser.username,
      requestedCoins: 500,
      feeCoins: 25,
      netPayoutInr: 475,
      upiId: 'vikram.rao@oksbi',
      bankName: 'State Bank of India',
      accountHolderName: 'Vikramaditya Rao',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    };
    this.withdrawals.set(initialWithdrawal.id, initialWithdrawal);
    this.withdrawalFeesTotal += 25;

    // Seed active demo rooms for live feel
    this.seedDemoRooms();
  }

  private seedDemoRooms() {
    const tier10 = this.config.roomTiers[0];
    const tier50 = this.config.roomTiers[1];
    const tier100 = this.config.roomTiers[2];

    const makeRoom = (tier: typeof tier10, status: GameRoom['status'], pCount: number): GameRoom => {
      const room: GameRoom = {
        id: `rm_${tier.id}_${Math.random().toString(36).substring(2, 7)}`,
        tierId: tier.id,
        tierName: tier.name,
        entryCoins: tier.entryCoins,
        status,
        createdAt: new Date().toISOString(),
        countdownEndsAt: status === 'COUNTDOWN' ? new Date(Date.now() + 85000).toISOString() : null,
        guessingEndsAt: status === 'GUESSING' ? new Date(Date.now() + 60000).toISOString() : null,
        revealEndsAt: null,
        jokerCard: null,
        winningMultiplier: tier.winnerMultiplier,
        players: [],
      };

      const mockNames = ['@shadow_ace', '@bluff_master', '@desi_king', '@lucky_777', '@card_hawk', '@neon_tiger', '@queen_spade', '@jack_striker'];
      for (let i = 0; i < pCount; i++) {
        room.players.push({
          userId: `bot_${i}_${tier.id}`,
          username: mockNames[i % mockNames.length] + (i > 3 ? `_${i}` : ''),
          avatarSeed: `bot_${i}`,
          joinedAt: new Date().toISOString(),
          selectedCard: status === 'GUESSING' ? (Math.floor(Math.random() * 3) + 1) : null,
          isLocked: status === 'GUESSING' ? (i % 2 === 0) : false,
          lockedAt: status === 'GUESSING' ? new Date().toISOString() : null,
          isDisconnected: false,
        });
      }
      return room;
    };

    const r1 = makeRoom(tier10, 'COUNTDOWN', 5);
    const r2 = makeRoom(tier50, 'WAITING', 2);
    const r3 = makeRoom(tier100, 'GUESSING', 4);

    this.rooms.set(r1.id, r1);
    this.rooms.set(r2.id, r2);
    this.rooms.set(r3.id, r3);
  }

  // 1-Second Server Authoritative Ticker
  private startServerTicker() {
    setInterval(() => {
      if (this.config.maintenanceMode) {
        return;
      }

      const now = Date.now();

      // Tick through all active rooms
      for (const [roomId, room] of this.rooms.entries()) {
        const activeCount = room.players.filter((p) => !p.isDisconnected).length;

        // 1. WAITING phase (< 3 players)
        if (room.status === 'WAITING') {
          if (activeCount >= 3) {
            room.status = 'COUNTDOWN';
            room.countdownEndsAt = new Date(now + this.config.matchmakingDurationSec * 1000).toISOString();
          }
        }

        // 2. COUNTDOWN phase (3 to 9 players, or 10 instant)
        else if (room.status === 'COUNTDOWN') {
          if (activeCount < 3) {
            // Drop below 3 resets countdown back to WAITING
            room.status = 'WAITING';
            room.countdownEndsAt = null;
          } else if (activeCount >= 10) {
            // Room full = instant launch!
            this.launchGame(room);
          } else if (room.countdownEndsAt && now >= new Date(room.countdownEndsAt).getTime()) {
            // 120s countdown reached 00:00 with at least 3 players
            this.launchGame(room);
          }
        }

        // 3. GUESSING phase (120s active cards)
        else if (room.status === 'GUESSING') {
          if (room.guessingEndsAt && now >= new Date(room.guessingEndsAt).getTime()) {
            // 120s guessing window expired -> transition to 10-second reveal!
            room.status = 'REVEALING';
            room.revealEndsAt = new Date(now + this.config.revealDurationSec * 1000).toISOString();

            // Run Dynamic Zero-Loss Joker Selection Algorithm
            this.executeZeroLossJokerAlgorithm(room);
          }
        }

        // 4. REVEALING phase (10s suspense countdown)
        else if (room.status === 'REVEALING') {
          if (room.revealEndsAt && now >= new Date(room.revealEndsAt).getTime()) {
            // 10s suspense ended -> Show results, distribute winnings, transition to ENDED
            this.concludeGameRound(room);
          }
        }

        // 5. ENDED phase (keep the result visible for 30 seconds, then archive it)
        else if (room.status === 'ENDED') {
          if (room.endedAt && now - new Date(room.endedAt).getTime() > 30000) {
            // Release active room from users
            for (const p of room.players) {
              const u = this.users.get(p.userId);
              if (u && u.activeRoomId === roomId) {
                u.activeRoomId = null;
              }
            }
            this.archiveRoom(roomId);
          }
        }
      }

      // High traffic simulated player activity if enabled
      if (this.simulatedTrafficActive) {
        this.simulateTrafficPulse();
      }
    }, 1000);
  }

  // Transitions room from Waiting/Countdown into Active Gameplay
  private launchGame(room: GameRoom) {
    room.status = 'GUESSING';
    room.countdownEndsAt = null;
    room.guessingEndsAt = new Date(Date.now() + this.config.guessingDurationSec * 1000).toISOString();

    // Ensure all simulated bot players pick a card and lock after random delays
    for (const p of room.players) {
      if (p.userId.startsWith('bot_')) {
        p.selectedCard = Math.floor(Math.random() * 3) + 1;
        p.isLocked = true;
        p.lockedAt = new Date().toISOString();
      }
    }
  }

  /**
   * SECTION 5: DYNAMIC ZERO-LOSS JOKER SELECTION ALGORITHM
   * Mathematical ground rules:
   * Winner Multiplier M = 2.0x
   * Max Allowed Winners = floor(Total Active Players / 2)
   * Rule 1: Any card chosen by > Max Allowed Winners is NEVER Joker.
   * Rule 2: Prefers card with >= 1 vote that does not exceed Max Winners.
   * Rule 3: Tie breaker random among eligible.
   * Rule 4: If all players choose exact same card, select from remaining 2 unselected at random.
   */
  public executeZeroLossJokerAlgorithm(room: GameRoom) {
    const activePlayers = room.players.filter((p) => !p.isDisconnected);
    const totalPlayers = activePlayers.length;
    const maxAllowedWinners = Math.max(1, Math.floor(totalPlayers / room.winningMultiplier)); // floor(N / 2)

    // Count locked votes for Card 1, Card 2, Card 3
    const cardVotes: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const p of activePlayers) {
      if (p.isLocked && p.selectedCard && cardVotes[p.selectedCard] !== undefined) {
        cardVotes[p.selectedCard]++;
      }
    }

    // Rule 1: Eligible cards must have votes <= maxAllowedWinners
    const eligibleWithVotes: number[] = [];
    const eligibleZeroVotes: number[] = [];

    for (let c = 1; c <= 3; c++) {
      const votes = cardVotes[c];
      if (votes <= maxAllowedWinners) {
        if (votes >= 1) {
          eligibleWithVotes.push(c); // Rule 2: Anti-rigging preference for human winners
        } else {
          eligibleZeroVotes.push(c);
        }
      }
    }

    let chosenJoker = 1;

    // Rule 2 & 3: Prefer card with at least 1 vote within safe limit, pick random among ties
    if (eligibleWithVotes.length > 0) {
      chosenJoker = eligibleWithVotes[Math.floor(Math.random() * eligibleWithVotes.length)];
    }
    // Fallback: If no cards with >= 1 vote qualify (e.g. all players chose the same card > limit)
    // Rule 4: Monolithic stacking fallback -> pick from zero-vote cards at random
    else if (eligibleZeroVotes.length > 0) {
      chosenJoker = eligibleZeroVotes[Math.floor(Math.random() * eligibleZeroVotes.length)];
    } else {
      // Theoretical extreme edge case: pick lowest vote card
      let minCard = 1;
      let minVotes = cardVotes[1];
      for (let c = 2; c <= 3; c++) {
        if (cardVotes[c] < minVotes) {
          minVotes = cardVotes[c];
          minCard = c;
        }
      }
      chosenJoker = minCard;
    }

    room.jokerCard = room.operatorJokerCard || chosenJoker;
  }

  // Finalizes the round, credits 2x coins to winners, updates metrics
  private concludeGameRound(room: GameRoom) {
    room.status = 'ENDED';
    room.endedAt = new Date().toISOString();

    const joker = room.jokerCard || 1;
    let totalCollected = room.players.length * room.entryCoins;
    let totalPayout = 0;

    for (const p of room.players) {
      if (p.isLocked && p.selectedCard === joker) {
        p.isWinner = true;
        p.payoutCoins = room.entryCoins * room.winningMultiplier;
        totalPayout += p.payoutCoins;

        // Credit to real user if not bot
        const realUser = this.users.get(p.userId);
        if (realUser) {
          realUser.coins += p.payoutCoins;
        }
      } else {
        p.isWinner = false;
        p.payoutCoins = 0;
      }
    }

    // Ledger accounting update
    const netHouseMargin = totalCollected - totalPayout;
    this.gameMarginsTotal += netHouseMargin;

    const hist = this.tierHistory.get(room.tierId);
    if (hist) {
      hist.gamesPlayed += 1;
      hist.turnoverCoins += totalCollected;
      hist.payoutCoins += totalPayout;
      hist.marginCoins += netHouseMargin;
    }
  }

  // Edge Case 7: Admin Maintenance Mode Hard Stop
  public triggerMaintenanceHardStop(enabled: boolean) {
    this.config.maintenanceMode = enabled;
    if (enabled) {
      // Instantly cancel all active games and waiting rooms and 100% refund entry fees
      for (const [roomId, room] of this.rooms.entries()) {
        for (const p of room.players) {
          const user = this.users.get(p.userId);
          if (user) {
            user.coins += room.entryCoins; // 100% refund
            user.activeRoomId = null;
          }
        }
        room.status = 'CANCELLED';
        room.cancelledAt = new Date().toISOString();
        room.cancelledBy = 'SYSTEM';
        this.roomHistory.set(roomId, structuredClone(room));
      }
      this.rooms.clear();
    }
  }

  public archiveRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    this.roomHistory.set(roomId, structuredClone(room));
    this.rooms.delete(roomId);
  }

  public cancelRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, message: 'Active room not found' };
    for (const player of room.players) {
      const user = this.users.get(player.userId);
      if (user) {
        user.coins += room.entryCoins;
        user.activeRoomId = null;
      }
    }
    room.status = 'CANCELLED';
    room.cancelledAt = new Date().toISOString();
    room.cancelledBy = 'ADMIN';
    this.archiveRoom(roomId);
    return { success: true, message: `Room ${roomId} cancelled and eligible players refunded.` };
  }

  /**
   * An operator override is intentionally explicit and auditable. It is allowed only
   * during the guessing window; the value is applied once the normal reveal begins.
   */
  public setOperatorJoker(roomId: string, jokerCard: number) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, message: 'Active room not found' };
    if (room.status !== 'GUESSING' || ![1, 2, 3].includes(jokerCard)) {
      return { success: false, message: 'Override is available only during the active guessing phase.' };
    }
    room.operatorJokerCard = jokerCard;
    room.operatorOverrideAt = new Date().toISOString();
    return { success: true, message: `Audited operator joker selection queued for room ${roomId}.` };
  }

  // High Traffic Simulated Pulse
  private simulateTrafficPulse() {
    // Keep 2-4 simulated active rooms running across tiers to demonstrate high concurrency
    const activeRooms = Array.from(this.rooms.values()).filter((r) => r.status !== 'ENDED');
    if (activeRooms.length < 5) {
      const randomTier = this.config.roomTiers[Math.floor(Math.random() * this.config.roomTiers.length)];
      if (randomTier && randomTier.enabled) {
        const newRoom: GameRoom = {
          id: `sim_${randomTier.id}_${Math.random().toString(36).substring(2, 6)}`,
          tierId: randomTier.id,
          tierName: randomTier.name,
          entryCoins: randomTier.entryCoins,
          status: 'COUNTDOWN',
          createdAt: new Date().toISOString(),
          countdownEndsAt: new Date(Date.now() + 45000).toISOString(),
          guessingEndsAt: null,
          revealEndsAt: null,
          jokerCard: null,
          winningMultiplier: randomTier.winnerMultiplier,
          players: [],
        };
        const pCount = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < pCount; i++) {
          newRoom.players.push({
            userId: `bot_sim_${Math.random().toString(36).substring(2, 6)}`,
            username: `@sim_player_${Math.floor(Math.random() * 900) + 100}`,
            avatarSeed: `seed_${i}`,
            joinedAt: new Date().toISOString(),
            selectedCard: null,
            isLocked: false,
            lockedAt: null,
            isDisconnected: false,
          });
        }
        this.rooms.set(newRoom.id, newRoom);
      }
    }
  }

  // Financial Analytics Compiler
  public getAnalytics(): FinancialAnalytics {
    let totalCirculatingCoins = 0;
    for (const u of this.users.values()) {
      totalCirculatingCoins += u.coins;
    }

    let activeGamesCount = 0;
    for (const r of this.rooms.values()) {
      if (r.status === 'GUESSING' || r.status === 'REVEALING') {
        activeGamesCount++;
      }
    }

    let pendingWithdrawalsCount = 0;
    for (const w of this.withdrawals.values()) {
      if (w.status === 'PENDING') {
        pendingWithdrawalsCount++;
      }
    }

    let openTicketsCount = 0;
    for (const t of this.supportTickets.values()) {
      if (t.status === 'OPEN' || t.status === 'UNDER_REVIEW') {
        openTicketsCount++;
      }
    }

    const tierPerformance = this.config.roomTiers.map((t) => {
      const hist = this.tierHistory.get(t.id) || { gamesPlayed: 0, turnoverCoins: 0, payoutCoins: 0, marginCoins: 0 };
      return {
        tierId: t.id,
        tierName: t.name,
        entryCoins: t.entryCoins,
        gamesPlayed: hist.gamesPlayed,
        turnoverCoins: hist.turnoverCoins,
        payoutCoins: hist.payoutCoins,
        marginCoins: hist.marginCoins,
      };
    });

    const qrUtilization = Array.from(this.qrAccounts.values()).map((q) => ({
      accountId: q.id,
      provider: q.provider,
      upiId: q.upiId,
      dailyCap: q.dailyCap,
      utilizedToday: q.utilizedToday,
      status: q.sessionStatus,
    }));

    return {
      platformNetProfit: this.gameMarginsTotal + this.withdrawalFeesTotal,
      gameMargin: this.gameMarginsTotal,
      withdrawalFeesCollected: this.withdrawalFeesTotal,
      grossDepositsInr: this.grossDepositsInr,
      grossWithdrawalsPaidInr: this.grossWithdrawalsPaidInr,
      totalPlayerLiability: totalCirculatingCoins,
      activeGamesCount,
      pendingWithdrawalsCount,
      openTicketsCount,
      totalRegisteredUsers: this.users.size + (this.simulatedTrafficActive ? this.simulatedPlayerCount : 0),
      tierPerformance,
      qrUtilization,
    };
  }
}

export const appStore = new AppStore();
