import { useEffect, useState } from 'react';
import { ServerCrash } from 'lucide-react';
import AppCard, { type Plant } from '../components/AppCard';
import type { Socket } from 'socket.io-client';
import './Dashboard.css';

interface DashboardProps {
  onSelectPlant: (plant: Plant) => void;
  socket: Socket | null;
  workspaceId: string;
}

const Dashboard = ({ onSelectPlant, socket, workspaceId }: DashboardProps) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('current-shelf', (data: Plant[]) => {
      console.log('Received shelf data:', data);
      setPlants(data);
    });

    socket.on('plant-update', (updatedData: { id: string, status: any, aiInsight?: string }) => {
      setPlants(prev => prev.map(p => 
        p.id === updatedData.id ? { ...p, status: updatedData.status } : p
      ));
    });

    // Request initial data
    if (socket.connected && workspaceId) {
      socket.emit('get-current-shelf', workspaceId);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('current-shelf');
      socket.off('plant-update');
    };
  }, [socket, workspaceId]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">배포 현황</h1>
          <p className="dashboard-subtitle">
            {isConnected ? '서버와 실시간 연동 중입니다.' : '서버와 연결이 끊겼습니다.'}
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
              onClick={() => onSelectPlant(plant)} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
