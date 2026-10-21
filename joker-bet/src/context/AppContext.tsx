import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '../services/api';
import { GameRoom, SystemConfig, UserProfile } from '../types/index';

type ScreenType =
  | 'SPLASH'
  | 'AUTH'
  | 'LOBBY'
  | 'WAITING'
  | 'GAME'
  | 'WALLET'
  | 'HISTORY'
  | 'SUPPORT'
  | 'DISTRIBUTION'
  | 'ADMIN';

type DeviceMode = 'ANDROID' | 'IOS' | 'RESPONSIVE';

interface AppContextType {
  user: UserProfile | null;
  config: SystemConfig | null;
  activeRoom: GameRoom | null;
  currentScreen: ScreenType;
  deviceMode: DeviceMode;
  sessionRevokedMessage: string | null;
  maintenanceModalOpen: boolean;
  versionUpdateModalOpen: boolean;
  walletTab: 'DEPOSIT' | 'WITHDRAWAL';
  setWalletTab: (tab: 'DEPOSIT' | 'WITHDRAWAL') => void;
  setCurrentScreen: (screen: ScreenType) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setUser: (user: UserProfile | null) => void;
  setActiveRoom: (room: GameRoom | null) => void;
  dismissSessionRevoked: () => void;
  dismissVersionModal: () => void;
  refreshUserData: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  logout: () => Promise<void>;
  joinRoomTier: (tierId: string) => Promise<{ success: boolean; message?: string }>;
  exitCurrentRoom: () => Promise<{ success: boolean; message?: string }>;
  lockCardChoice: (cardIndex: number) => Promise<{ success: boolean; message?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [currentScreen, setCurrentScreenState] = useState<ScreenType>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (hash === '#admin' || hash === '#/admin' || path.startsWith('/admin') || params.get('portal') === 'admin') {
        return 'ADMIN';
      }
    }
    return 'SPLASH';
  });

  const setCurrentScreen = useCallback((screen: ScreenType) => {
    setCurrentScreenState(screen);
    if (typeof window !== 'undefined') {
      if (screen === 'ADMIN') {
        window.location.hash = '#admin';
      } else if (window.location.hash.includes('admin')) {
        window.location.hash = '#/';
      }
    }
  }, []);

  // Listen to hash changes and operator keyboard shortcut (Alt + A)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#/admin') {
        setCurrentScreenState('ADMIN');
      } else if (hash === '#/' || hash === '') {
        setCurrentScreenState((prev) => (prev === 'ADMIN' ? 'LOBBY' : prev));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret operator shortcut Alt + A or Ctrl + Shift + A
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setCurrentScreenState((prev) => {
          const next = prev === 'ADMIN' ? 'LOBBY' : 'ADMIN';
          window.location.hash = next === 'ADMIN' ? '#admin' : '#/';
          return next;
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [deviceMode, setDeviceMode] = useState<DeviceMode>('RESPONSIVE');
  const [sessionRevokedMessage, setSessionRevokedMessage] = useState<string | null>(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [versionUpdateModalOpen, setVersionUpdateModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');

  // Intercept session revocations from API
  useEffect(() => {
    api.onSessionRevoked = (message: string) => {
      setSessionRevokedMessage(message);
      setUser(null);
      setActiveRoom(null);
      setCurrentScreenState('AUTH');
    };

    api.onMaintenanceMode = (active: boolean) => {
      setMaintenanceModalOpen(active);
      if (active) {
        setActiveRoom(null);
      }
    };
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await api.getConfig();
      if (res.config) {
        setConfig(res.config);
        if (res.config.maintenanceMode) {
          setMaintenanceModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);

        // State Rehydration Engine: Seamless Multi-Device State Handoff
        if (res.activeRoom) {
          setActiveRoom(res.activeRoom);
          if (res.activeRoom.status === 'WAITING' || res.activeRoom.status === 'COUNTDOWN') {
            setCurrentScreen('WAITING');
          } else if (res.activeRoom.status === 'GUESSING' || res.activeRoom.status === 'REVEALING') {
            setCurrentScreen('GAME');
          }
        } else {
          setActiveRoom(null);
          // Only redirect away from active game/waiting screens if room ended
          setCurrentScreenState((prev) => (prev === 'WAITING' || prev === 'GAME' ? 'LOBBY' : prev));
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Session expired')) {
        // Handled via interceptor
      }
    }
  }, []);

  // Initial Boot & Splash flow
  useEffect(() => {
    const initApp = async () => {
      await refreshConfig();

      // Check app version
      try {
        const ver = await api.checkVersion('1.0.4');
        if (ver.isForceUpdate) {
          setVersionUpdateModalOpen(true);
        }
      } catch (err) {
        console.error('Version check error:', err);
      }

      if (api.getToken()) {
        await refreshUserData();
      } else {
        // Delay splash slightly for visual polish
        setTimeout(() => {
          setCurrentScreenState((prev) => (prev === 'ADMIN' ? 'ADMIN' : 'AUTH'));
        }, 1800);
      }
    };

    initApp();
  }, [refreshConfig, refreshUserData]);

  // Real-time synchronization ticker (Every 1 second when in room or active game)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.user);
          if (res.activeRoom) {
            setActiveRoom(res.activeRoom);

            // Screen transitions based on server authoritative room state
            if (
              (res.activeRoom.status === 'WAITING' || res.activeRoom.status === 'COUNTDOWN') &&
              currentScreen !== 'WAITING' &&
              currentScreen !== 'ADMIN'
            ) {
              setCurrentScreen('WAITING');
            } else if (
              (res.activeRoom.status === 'GUESSING' || res.activeRoom.status === 'REVEALING') &&
              currentScreen !== 'GAME' &&
              currentScreen !== 'ADMIN'
            ) {
              setCurrentScreen('GAME');
            }
          } else if (activeRoom && (currentScreen === 'WAITING' || currentScreen === 'GAME')) {
            // Room finished or dismissed
            setActiveRoom(null);
            setCurrentScreen('LOBBY');
          }
        }
      } catch (err) {
        // Session interceptor handles errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, activeRoom, currentScreen]);

  const logout = async () => {
    await api.logout();
    setUser(null);
    setActiveRoom(null);
    setCurrentScreen('AUTH');
  };

  const joinRoomTier = async (tierId: string) => {
    try {
      const res = await api.joinRoom(tierId);
      if (res.success && res.room) {
        setActiveRoom(res.room);
        setUser((prev) => (prev ? { ...prev, coins: res.remainingCoins, activeRoomId: res.room.id } : prev));
        setCurrentScreen(res.room.status === 'GUESSING' ? 'GAME' : 'WAITING');
        return { success: true };
      }
      return { success: false, message: 'Could not join room' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to join room' };
    }
  };

  const exitCurrentRoom = async () => {
    if (!activeRoom) return { success: false, message: 'No active room' };
    try {
      const res = await api.exitRoom(activeRoom.id);
      if (res.success) {
        setActiveRoom(null);
        setUser((prev) => (prev ? { ...prev, coins: res.coins, activeRoomId: null } : prev));
        setCurrentScreen('LOBBY');
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Could not exit room' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to exit room' };
    }
  };

  const lockCardChoice = async (cardIndex: number) => {
    if (!activeRoom) return { success: false, message: 'No active room' };
    try {
      const res = await api.lockCard(activeRoom.id, cardIndex);
      if (res.success) {
        setActiveRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map((p) =>
              p.userId === user?.id ? { ...p, selectedCard: cardIndex, isLocked: true } : p
            ),
          };
        });
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Failed to lock card' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to lock card' };
    }
  };

  const dismissSessionRevoked = () => {
    setSessionRevokedMessage(null);
    setCurrentScreen('AUTH');
  };

  const dismissVersionModal = () => {
    setVersionUpdateModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        config,
        activeRoom,
        currentScreen,
        deviceMode,
        sessionRevokedMessage,
        maintenanceModalOpen,
        versionUpdateModalOpen,
        walletTab,
        setWalletTab,
        setCurrentScreen,
        setDeviceMode,
        setUser,
        setActiveRoom,
        dismissSessionRevoked,
        dismissVersionModal,
        refreshUserData,
        refreshConfig,
        logout,
        joinRoomTier,
        exitCurrentRoom,
        lockCardChoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
