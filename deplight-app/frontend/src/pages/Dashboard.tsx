import { useEffect, useState, useRef } from 'react';
import { ServerCrash } from 'lucide-react';
import AppCard, { type Plant } from '../components/AppCard';
import { mapServiceToPlant, type FastAPIServiceDTO } from '../utils/mappers';
import './Dashboard.css';

interface DashboardProps {
  onSelectPlant: (plant: Plant) => void;
  workspaceId: string;
}

const Dashboard = ({ onSelectPlant, workspaceId }: DashboardProps) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  

  useEffect(() => {
    let isMounted = true;

    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.success && Array.isArray(data.services) && isMounted) {
          setIsConnected(true);
          const mappedPlants = data.services.map((service: FastAPIServiceDTO) => mapServiceToPlant(service));
          setPlants(mappedPlants);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        if (isMounted) setIsConnected(false);
      }
    };

    // Initial fetch
    fetchServices();

    // Polling every 3 seconds
    const interval = setInterval(fetchServices, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workspaceId]);

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
