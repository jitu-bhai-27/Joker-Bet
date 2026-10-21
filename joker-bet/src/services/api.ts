import {
  GameRoom,
  QRAccount,
  DepositReservation,
  WithdrawalRequest,
  SupportTicket,
  SystemConfig,
  UserProfile,
  FinancialAnalytics,
} from '../types/index';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;
  public onSessionRevoked?: (message: string) => void;
  public onMaintenanceMode?: (active: boolean) => void;

  constructor() {
    this.token = localStorage.getItem('jokerbet_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('jokerbet_token', token);
    } else {
      localStorage.removeItem('jokerbet_token');
    }
  }

  public getToken() {
    return this.token;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Single Active Session Revocation interceptor
    if (response.status === 403 && data.code === 'SESSION_REVOKED') {
      this.setToken(null);
      if (this.onSessionRevoked) {
        this.onSessionRevoked(data.message || 'Logged in from another device. Session expired.');
      }
      throw new Error(data.message || 'Session expired');
    }

    // Maintenance Mode interceptor
    if (response.status === 503 && this.onMaintenanceMode) {
      this.onMaintenanceMode(true);
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  }

  // Config & App
  async getConfig(): Promise<{ config: SystemConfig; serverTime: string }> {
    return this.request('/config');
  }

  async checkVersion(version: string = '1.0.4') {
    return this.request(`/app/version?version=${version}`);
  }

  // Auth
  async sendOtp(email: string) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string, confirmed18Plus: boolean) {
    const res = await this.request<{ success: boolean; token: string; user: UserProfile; isNewUser: boolean }>(
      '/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email, otp, confirmed18Plus }),
      }
    );
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async checkUsername(username: string, currentUserId?: string) {
    return this.request<{ success: boolean; available: boolean; formatted: string; message: string }>(
      '/auth/check-username',
      {
        method: 'POST',
        body: JSON.stringify({ username, currentUserId }),
      }
    );
  }

  async setupProfile(profile: { username: string; fullName?: string; dob?: string; gender?: string }) {
    return this.request<{ success: boolean; user: UserProfile }>('/auth/setup-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: UserProfile; activeRoom: GameRoom | null }>('/auth/me');
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Rooms
  async getRooms() {
    return this.request<{ success: boolean; tiers: any[]; activeRoom: GameRoom | null }>('/rooms');
  }

  async joinRoom(tierId: string) {
    return this.request<{ success: boolean; room: GameRoom; remainingCoins: number }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ tierId }),
    });
  }

  async exitRoom(roomId: string) {
    return this.request<{ success: boolean; message: string; coins: number }>('/rooms/exit', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });
  }

  async lockCard(roomId: string, cardIndex: number) {
    return this.request<{ success: boolean; message: string; player: any }>('/rooms/lock-card', {
      method: 'POST',
      body: JSON.stringify({ roomId, cardIndex }),
    });
  }

  // Wallet
  async reserveQr(amount: number) {
    return this.request<{
      success: boolean;
      reservation: DepositReservation;
      accountHolder: string;
      provider: string;
    }>('/wallet/reserve-qr', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async submitUtr(reservationId: string, utr: string, simulateDelay = false, simulateMismatch = false) {
    return this.request<{
      success: boolean;
      message: string;
      coins?: number;
      code?: string;
    }>('/wallet/submit-utr', {
      method: 'POST',
      body: JSON.stringify({ reservationId, utr, simulateDelay, simulateMismatch }),
    });
  }

  async correctDepositAmount(reservationId: string, correctedAmount: number) {
    return this.request<{
      success: boolean;
      message: string;
      coins: number;
    }>('/wallet/correct-amount', {
      method: 'POST',
      body: JSON.stringify({ reservationId, correctedAmount }),
    });
  }

  async withdraw(data: { coins: number; upiId: string }) {
    return this.request<{
      success: boolean;
      message: string;
      remainingCoins: number;
      withdrawal: WithdrawalRequest;
    }>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWalletHistory() {
    return this.request<{
      success: boolean;
      deposits: DepositReservation[];
      withdrawals: WithdrawalRequest[];
      gameRounds: any[];
    }>('/wallet/history');
  }

  // Support
  async createTicket(data: {
    category: string;
    referenceId?: string;
    description: string;
    screenshotUrl?: string;
    attachmentType?: 'IMAGE' | 'PDF' | 'VIDEO';
    attachmentName?: string;
    attachmentData?: string;
  }) {
    return this.request<{ success: boolean; message: string; ticket: SupportTicket }>('/support/ticket', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyTickets() {
    return this.request<{ success: boolean; tickets: SupportTicket[] }>('/support/my-tickets');
  }

  // Admin APIs
  async adminLogin(password: string) {
    return this.request<{ success: boolean; adminToken: string; role: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getAdminAnalytics() {
    return this.request<{ success: boolean; analytics: FinancialAnalytics }>('/admin/analytics');
  }

  async getAdminLiveRooms() {
    return this.request<{ success: boolean; rooms: any[] }>('/admin/live-rooms');
  }

  async cancelAdminRoom(roomId: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/rooms/${roomId}/cancel`, { method: 'POST' });
  }

  async setAdminRoomJoker(roomId: string, jokerCard: number) {
    return this.request<{ success: boolean; message: string }>(`/admin/rooms/${roomId}/joker`, {
      method: 'POST',
      body: JSON.stringify({ jokerCard }),
    });
  }

  async getAdminRoomHistory(roomId = '') {
    const suffix = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
    return this.request<{ success: boolean; rooms: GameRoom[] }>(`/admin/rooms/history${suffix}`);
  }

  async updateAdminConfig(configPatch: Partial<SystemConfig>) {
    return this.request<{ success: boolean; config: SystemConfig; message: string }>('/admin/config/update', {
      method: 'POST',
      body: JSON.stringify(configPatch),
    });
  }

  async updateCardAssets(assets: SystemConfig['cardAssets']) {
    return this.request<{ success: boolean; assets: any; message: string }>('/admin/assets/update', {
      method: 'POST',
      body: JSON.stringify(assets),
    });
  }

  async getAdminQrAccounts() {
    return this.request<{ success: boolean; accounts: QRAccount[] }>('/admin/qr-accounts');
  }

  async saveQrAccount(account: Partial<QRAccount>) {
    return this.request<{ success: boolean; account: QRAccount; message: string }>('/admin/qr-accounts/save', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async deleteQrAccount(id: string) {
    return this.request<{ success: boolean; message: string }>('/admin/qr-accounts/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  async getAdminWithdrawals() {
    return this.request<{ success: boolean; withdrawals: WithdrawalRequest[] }>('/admin/withdrawals');
  }

  async approveWithdrawal(id: string, bankUtr: string, adminSourceBankCode: string) {
    return this.request<{ success: boolean; withdrawal: WithdrawalRequest; message: string }>(
      '/admin/withdrawals/approve',
      {
        method: 'POST',
        body: JSON.stringify({ id, bankUtr, adminSourceBankCode }),
      }
    );
  }

  async rejectWithdrawal(id: string, rejectionReason: string) {
    return this.request<{ success: boolean; withdrawal: WithdrawalRequest; message: string }>(
      '/admin/withdrawals/reject',
      {
        method: 'POST',
        body: JSON.stringify({ id, rejectionReason }),
      }
    );
  }

  async getAdminTickets() {
    return this.request<{ success: boolean; tickets: SupportTicket[] }>('/admin/support-tickets');
  }

  async replyTicket(ticketId: string, replyMessage: string, newStatus?: string) {
    return this.request<{ success: boolean; ticket: SupportTicket; message: string }>(
      '/admin/support-tickets/reply',
      {
        method: 'POST',
        body: JSON.stringify({ ticketId, replyMessage, newStatus }),
      }
    );
  }

  async getAdminUsers(query = '') {
    return this.request<{ success: boolean; users: UserProfile[] }>(`/admin/users?q=${encodeURIComponent(query)}`);
  }

  async adjustUserBalance(userId: string, deltaCoins: number, auditRemark: string) {
    return this.request<{ success: boolean; user: UserProfile; message: string }>('/admin/users/adjust-balance', {
      method: 'POST',
      body: JSON.stringify({ userId, deltaCoins, auditRemark }),
    });
  }

  async toggleUserBan(userId: string) {
    return this.request<{ success: boolean; user: UserProfile; message: string }>('/admin/users/toggle-ban', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async toggleMaintenance(enabled: boolean) {
    return this.request<{ success: boolean; maintenanceMode: boolean; message: string }>(
      '/admin/maintenance/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }
    );
  }

  async toggleSimulation(enabled: boolean, playerCount?: number) {
    return this.request<{
      success: boolean;
      simulatedTrafficActive: boolean;
      simulatedPlayerCount: number;
      message: string;
    }>('/admin/simulation/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled, playerCount }),
    });
  }

  async getSecurityStats() {
    return this.request<{
      success: boolean;
      status: string;
      metrics: any;
      defenseLayers: string[];
    }>('/security/stats');
  }

  async simulateAttack(attackType: 'DDOS_BURST' | 'AUTH_BRUTE_FORCE' | 'INJECTION_ATTEMPT' | 'TAMPERED_TRANSACTION') {
    return this.request<{
      success: boolean;
      attackType: string;
      outcome: string;
      message: string;
    }>('/security/simulate-attack', {
      method: 'POST',
      body: JSON.stringify({ attackType }),
    });
  }

  async toggleIpBlock(ip: string, action: 'BLOCK' | 'UNBLOCK') {
    return this.request<{
      success: boolean;
      message: string;
    }>('/security/toggle-ip-block', {
      method: 'POST',
      body: JSON.stringify({ ip, action }),
    });
  }
}

export const api = new ApiService();
