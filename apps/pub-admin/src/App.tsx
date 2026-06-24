import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { DataMasterProvider } from './contexts/DataMasterContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayoutInner } from './components/layout/MainLayout';
import SplashScreen from './components/layout/SplashScreen';

function AppContent({ showSplash }: { showSplash: boolean }) {
  const { isDbInitialized } = useAppContext();

  if (!isDbInitialized) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <DataMasterProvider>
        <WorkflowProvider isDbInitialized={isDbInitialized}>
          {showSplash ? <SplashScreen /> : <MainLayoutInner />}
        </WorkflowProvider>
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
