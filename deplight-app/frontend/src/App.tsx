import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import WorkspaceSelection from './pages/WorkspaceSelection';
import Deployment from './pages/Deployment';
import type { Plant } from './components/AppCard';
import './App.css';

function App() {
  const [authState, setAuthState] = useState<'login' | 'workspace' | 'app'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // Main App View
  return (
    <div className="app-container">
      <Sidebar 
        activeTab={selectedPlant ? 'deployment-detail' : activeTab} 
        setActiveTab={(tab) => {
          setSelectedPlant(null); // Clear selected plant when changing tabs
          setActiveTab(tab);
        }} 
      />
      
      <main className="main-content">
        {selectedPlant ? (
          <Deployment 
            plant={selectedPlant} 
            onBack={() => setSelectedPlant(null)} 
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                onSelectPlant={(plant) => setSelectedPlant(plant)} 
                workspaceId={workspaceId}
              />
            )}
            
            {activeTab === 'deploy' && (
              <div className="glass-panel" style={{ padding: '64px 40px', textAlign: 'center', marginTop: '40px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>새 앱 배포</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  GitHub 레포지토리를 연결하여 새로운 컨테이너를 배포합니다.
                  <br/>이 화면은 추후 배포 폼으로 교체됩니다.
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '24px' }}
                  onClick={() => setActiveTab('dashboard')}
                >
                  대시보드로 돌아가기
                </button>
              </div>
            )}

            {activeTab === 'settings' && <Settings />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
