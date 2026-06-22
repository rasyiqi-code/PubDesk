import { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { DataMasterProvider } from './contexts/DataMasterContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayoutInner } from './components/layout/MainLayout';
import SplashScreen from './components/layout/SplashScreen';
import { useAppContext } from './contexts/AppContext';

/**
 * WorkflowWrapper membaca isDbInitialized dari AppContext dan meneruskannya
 * ke WorkflowProvider agar tasks tidak dimuat sebelum DB siap.
 */
function WorkflowWrapper({ children }: { children: React.ReactNode }) {
  const { isDbInitialized } = useAppContext();
  return (
    <WorkflowProvider isDbInitialized={isDbInitialized}>
      {children}
    </WorkflowProvider>
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
      <AuthProvider>
        <DataMasterProvider>
          <WorkflowWrapper>
            <InvoiceProvider>
              {showSplash ? <SplashScreen /> : <MainLayoutInner />}
            </InvoiceProvider>
          </WorkflowWrapper>
        </DataMasterProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
