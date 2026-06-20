import MainLayout from './components/layout/MainLayout';
import { AppProvider } from './contexts/AppContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { CrmProvider } from './contexts/CrmContext';

function App() {
  return (
    <AppProvider>
      <CrmProvider>
        <InvoiceProvider>
          <MainLayout />
        </InvoiceProvider>
      </CrmProvider>
    </AppProvider>
  );
}

export default App;
