import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'deploy' && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
            <h2>새 앱 배포 (준비 중)</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
              이 화면은 추후 배포 모달/폼으로 구성될 예정입니다.
            </p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
            <h2>설정 (준비 중)</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
