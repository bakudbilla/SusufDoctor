import { useState } from 'react';
import { Navigation } from './components/layout/navigation';
import { Dashboard } from './pages/dashboard';
import { UploadPage } from './pages/upload-page';
import { PatientsPage } from './pages/patients-page';
import Settings from './pages/settings'

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'upload':
        return <UploadPage />;
      case 'patients':
        return <PatientsPage />;
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#DFFBFA]">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}