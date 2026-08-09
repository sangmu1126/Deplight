import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import WorkspaceSelection from './pages/WorkspaceSelection';
import Deployment from './pages/Deployment';
import { Bell, User } from 'lucide-react';
import type { Plant } from './components/AppCard';
import './App.css';

function App() {
  const [authState, setAuthState] = useState<'login' | 'workspace' | 'app'>('login');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>('');

  // If not logged in
  if (authState === 'login') {
    return <Login onLoginSuccess={() => setAuthState('workspace')} />;
  }

  // If logged in but no workspace selected
  if (authState === 'workspace') {
    return <WorkspaceSelection onSelect={(id) => {
      console.log('Selected workspace:', id);
      setWorkspaceId(id);
      setAuthState('app');
    }} />;
  }

  // Main App View with Top-Nav (No Sidebar)
  return (
    <div className="workspace-page" style={{ minHeight: '100vh', width: '100vw' }}>
      <header className="workspace-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 48px' }}>
        <div className="workspace-logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <span>Deplight</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '32px', paddingLeft: '32px', borderLeft: '1px solid #E2E8F0', fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>
            Development Team
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <Bell size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <User size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>김개발</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>kim@company.com</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </header>
      
      <main className="main-content" style={{ background: '#F8F9FE', minHeight: 'calc(100vh - 70px)' }}>
        {selectedPlant ? (
          <Deployment 
            plant={selectedPlant} 
            onBack={() => setSelectedPlant(null)} 
          />
        ) : (
          <Dashboard 
            onSelectPlant={(plant) => setSelectedPlant(plant)} 
            workspaceId={workspaceId}
          />
        )}
      </main>
    </div>
  );
}

export default App;
