import { AppProvider } from './contexts/AppContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { DataMasterProvider } from './contexts/DataMasterContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayoutInner } from './components/layout/MainLayout';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <DataMasterProvider>
          <WorkflowProvider>
            <InvoiceProvider>
              <MainLayoutInner />
            </InvoiceProvider>
          </WorkflowProvider>
        </DataMasterProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
