import { useEffect, useState } from 'react';
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
  
  // Deploy Modal State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [framework, setFramework] = useState('FastAPI');
  const [isDeploying, setIsDeploying] = useState(false);
  

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (isMounted) setIsConnected(res.ok);
      } catch {
        if (isMounted) setIsConnected(false);
      }
    };

    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.success && Array.isArray(data.services) && isMounted) {
          const mappedPlants = data.services.map((service: FastAPIServiceDTO) => mapServiceToPlant(service));
          setPlants(mappedPlants);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    // Initial fetch
    checkHealth();
    fetchServices();

    // Polling every 3 seconds
    const healthInterval = setInterval(checkHealth, 5000);
    const serviceInterval = setInterval(fetchServices, 3000);

    return () => {
      isMounted = false;
      clearInterval(healthInterval);
      clearInterval(serviceInterval);
    };
  }, [workspaceId]);

  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsDeploying(true);
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: repoUrl,
          branch,
          framework
        })
      });

      if (!response.ok) throw new Error('Deployment failed');
      
      const responseData = await response.json();
      
      // Close modal and reset
      setIsDeployModalOpen(false);
      setRepoUrl('');
      setBranch('main');
      
      // Fetch immediately to update the list, but also auto-navigate!
      fetch('/api/services')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.services)) {
            setPlants(data.services.map((service: FastAPIServiceDTO) => mapServiceToPlant(service)));
          }
        });

      // Auto-navigate to the new deployment status view!
      if (responseData.deployment_id) {
        onSelectPlant({
          id: responseData.deployment_id,
          description: 'New App',
          version: repoUrl.split('/').pop()?.replace('.git', '') || 'Unknown Version',
          branch: branch || 'main',
          status: 'DEPLOYING',
          gitUrl: repoUrl,
          updatedAt: new Date(),
          plantType: 'pot'
        });
      }

    } catch (error) {
      console.error('Failed to trigger deployment:', error);
      alert('Failed to start deployment');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">배포 현황</h1>
          <p className="dashboard-subtitle">
            {isConnected ? '서버와 실시간 연동 중입니다.' : '서버와 연결이 끊겼습니다.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsDeployModalOpen(true)}>
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

      {isDeployModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>새 앱 배포하기</h2>
            <form onSubmit={handleDeploySubmit}>
              <div className="form-group">
                <label>GitHub Repository URL</label>
                <input 
                  type="text" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input 
                  type="text" 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main" 
                />
              </div>
              <div className="form-group">
                <label>Framework</label>
                <select value={framework} onChange={(e) => setFramework(e.target.value)}>
                  <option value="FastAPI">FastAPI (Python)</option>
                  <option value="React">React (Node.js)</option>
                  <option value="Next.js">Next.js</option>
                  <option value="Express">Express (Node.js)</option>
                </select>
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDeployModalOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" disabled={isDeploying || !repoUrl}>
                  {isDeploying ? '요청 중...' : '배포 시작'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
