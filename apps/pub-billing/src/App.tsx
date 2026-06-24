import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { DataMasterProvider } from './contexts/DataMasterContext';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayoutInner } from './components/layout/MainLayout';
import SplashScreen from './components/layout/SplashScreen';

function AppContent({ showSplash }: { showSplash: boolean }) {
  const { isDbInitialized, initError, retryInit } = useAppContext();

  if (!isDbInitialized) {
    return <SplashScreen initError={initError} onRetry={retryInit} />;
  }

  return (
    <AuthProvider>
      <DataMasterProvider>
        <InvoiceProvider>
          {showSplash ? <SplashScreen /> : <MainLayoutInner />}
        </InvoiceProvider>
      </DataMasterProvider>
    </AuthProvider>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProvider>
      <AppContent showSplash={showSplash} />
    </AppProvider>
  );
}

export default App;
