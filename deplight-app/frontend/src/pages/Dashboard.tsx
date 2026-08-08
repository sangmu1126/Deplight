import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ServerCrash } from 'lucide-react';
import AppCard, { type Plant } from '../components/AppCard';
import './Dashboard.css';

const SOCKET_URL = import.meta.env.MODE === 'production' 
  ? window.location.origin 
  : 'http://localhost:8080';

const Dashboard = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Hardcoded for demo, normally fetched from auth/workspace selection
  const WORKSPACE_ID = 'demo-workspace-123'; 
  const FAKE_TOKEN = 'demo-token'; // In a real app, use Firebase auth token

  useEffect(() => {
    // 1. Initialize Socket
    const newSocket = io(SOCKET_URL, {
      auth: { token: FAKE_TOKEN },
      // Note: Backend might reject fake tokens if Firebase Admin is checking it strictly.
      // For this UI demo, we'll gracefully handle connection errors or mock the data if needed.
    });

    // 2. Set up listeners
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      // Request to join workspace
      newSocket.emit('join-workspace', WORKSPACE_ID);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
      
      // Fallback: load fake data so the UI is visible even without backend auth
      setPlants([
        {
          id: '1',
          version: 'Delightful App v1.0',
          description: 'Next.js 블로그 애플리케이션',
          status: 'HEALTHY',
          updatedAt: new Date(),
          gitUrl: 'https://github.com/Softbank-mango/blog',
          plantType: 'rose'
        },
        {
          id: '2',
          version: 'Payment Service API',
          description: '결제 모듈 마이크로서비스',
          status: 'DEPLOYING',
          updatedAt: new Date(Date.now() - 1000 * 60 * 5),
          gitUrl: 'https://github.com/Softbank-mango/payments',
          plantType: 'sunflower'
        },
        {
          id: '3',
          version: 'Legacy Admin Panel',
          description: '구형 어드민 패널 (사용량 적음)',
          status: 'SLEEPING',
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          gitUrl: 'https://github.com/Softbank-mango/admin',
          plantType: 'pot'
        }
      ]);
    });

    newSocket.on('current-shelf', (data: Plant[]) => {
      console.log('Received shelf data:', data);
      setPlants(data);
    });

    newSocket.on('plant-update', (updatedData: { id: string, status: any, aiInsight?: string }) => {
      setPlants(prev => prev.map(p => 
        p.id === updatedData.id ? { ...p, status: updatedData.status } : p
      ));
    });

    // 3. Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">배포 현황</h1>
          <p className="dashboard-subtitle">
            {isConnected ? '서버와 실시간 연동 중입니다.' : '서버 인증 대기 중 (UI 데모 데이터 표시)'}
          </p>
        </div>
        <button className="btn btn-primary">
          + 새 앱 배포
        </button>
      </div>

      <div className="apps-grid">
        {plants.length === 0 ? (
          <div className="empty-state">
            <ServerCrash className="empty-icon" />
            <h3 style={{ marginBottom: '8px' }}>배포된 앱이 없습니다</h3>
            <p className="empty-text">우측 상단의 버튼을 눌러 첫 번째 앱을 배포해 보세요.</p>
          </div>
        ) : (
          plants.map((plant) => (
            <AppCard 
              key={plant.id} 
              plant={plant} 
              onClick={() => console.log('Clicked', plant.id)} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
