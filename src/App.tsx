import MainLayout from './components/layout/MainLayout';
import { AppProvider } from './contexts/AppContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { DataMasterProvider } from './contexts/DataMasterContext';

function App() {
  return (
    <AppProvider>
      <DataMasterProvider>
        <InvoiceProvider>
          <MainLayout />
        </InvoiceProvider>
      </DataMasterProvider>
    </AppProvider>
  );
}

export default App;
