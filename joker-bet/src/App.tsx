import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { WebLayout } from './components/layout/WebLayout';
import { SplashScreen } from './components/screens/SplashScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { WaitingRoomScreen } from './components/screens/WaitingRoomScreen';
import { GameTableScreen } from './components/screens/GameTableScreen';
import { WalletScreen } from './components/screens/WalletScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { SupportScreen } from './components/screens/SupportScreen';
import { DistributionScreen } from './components/screens/DistributionScreen';
import { AdminPanel } from './components/admin/AdminPanel';

const ScreenRouter: React.FC = () => {
  const { currentScreen } = useApp();

  // Isolated Admin Portal (Separated from player website)
  if (currentScreen === 'ADMIN') {
    return <AdminPanel />;
  }

  // All player-facing website views are mounted inside the responsive WebLayout
  return (
    <WebLayout>
      {(() => {
        switch (currentScreen) {
          case 'SPLASH':
            return <SplashScreen />;
          case 'AUTH':
            return <AuthScreen />;
          case 'LOBBY':
            return <LobbyScreen />;
          case 'WAITING':
            return <WaitingRoomScreen />;
          case 'GAME':
            return <GameTableScreen />;
          case 'WALLET':
            return <WalletScreen />;
          case 'HISTORY':
            return <HistoryScreen />;
          case 'SUPPORT':
            return <SupportScreen />;
          case 'DISTRIBUTION':
            return <DistributionScreen />;
          default:
            return <LobbyScreen />;
        }
      })()}
    </WebLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}
