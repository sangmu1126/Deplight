import { useState, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import WorkspaceSelection from './pages/WorkspaceSelection';
import Deployment from './pages/Deployment';
import type { Plant } from './components/AppCard';
import './App.css';

const SOCKET_URL = import.meta.env.MODE === 'production' 
  ? window.location.origin 
  : 'http://localhost:8080';

function App() {
  const [authState, setAuthState] = useState<'login' | 'workspace' | 'app'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>('');

  useEffect(() => {
    if (authState === 'app') {
      const FAKE_TOKEN = 'demo-token'; // In a real app, use Firebase auth token
      const newSocket = io(SOCKET_URL, {
        auth: { token: FAKE_TOKEN },
      });

      newSocket.on('connect', () => {
        console.log('Connected to server globally');
        if (workspaceId) {
          newSocket.emit('join-workspace', workspaceId);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [authState, workspaceId]);

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
            socket={socket}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                onSelectPlant={(plant) => setSelectedPlant(plant)} 
                socket={socket}
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
