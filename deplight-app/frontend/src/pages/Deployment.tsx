import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Rocket, Globe, Activity } from 'lucide-react';
import MetricsChart from '../components/MetricsChart';
import type { Plant } from '../components/AppCard';
import './Deployment.css';

interface DeploymentProps {
  plant: Plant;
  onBack: () => void;
}

interface LogEntry {
  id: string;
  time: string;
  message: string;
  status: string;
}

const Deployment = ({ plant, onBack }: DeploymentProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cpuData, setCpuData] = useState<{time: string, cpu: number}[]>([]);
  const [memData, setMemData] = useState<{time: string, mem: number}[]>([]);
  const [currentPlant, setCurrentPlant] = useState<Plant>(plant);
  const [progress, setProgress] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let lastLogCount = 0;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/deploy/${currentPlant.id}/status`);
        if (!response.ok) throw new Error('Status fetch failed');
        
        const data = await response.json();
        
        if (!isMounted) return;

        if (data.success) {
          // Update status
          if (data.status) {
             // Basic mapping, could use mapper here if needed
             const newStatus = data.status === 'success' ? 'HEALTHY' : 
                               data.status === 'failed' ? 'ERROR' : 'DEPLOYING';
             setCurrentPlant(prev => prev.status !== newStatus ? { ...prev, status: newStatus } : prev);
          }
          
          setProgress(data.progress || 0);

          // Update logs if there are new ones
          if (data.logs && Array.isArray(data.logs)) {
             if (data.logs.length > lastLogCount) {
               const newLogs = data.logs.slice(lastLogCount).map((l: any, i: number) => ({
                 id: Date.now().toString() + i,
                 time: new Date(l.timestamp || Date.now()).toLocaleTimeString(),
                 message: l.message,
                 status: l.type || 'info'
               }));
               setLogs(prev => [...prev, ...newLogs].slice(-200));
               lastLogCount = data.logs.length;
             }
          }

          // Generate mock metrics for now, since FastAPI doesn't provide them yet
          const time = new Date().toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'});
          setCpuData(prev => [...prev, { time, cpu: Math.random() * 20 + 5 }].slice(-20));
          setMemData(prev => [...prev, { time, mem: Math.random() * 30 + 40 }].slice(-20));
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 3 seconds
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentPlant.id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="deployment-container">
      <div className="deployment-header">
        <div className="deployment-title-group">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="deployment-title">{currentPlant.version}</h1>
            <div className="deployment-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={14} /> ID: {currentPlant.id.substring(0, 8)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={14} /> {currentPlant.gitUrl || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                진행률: {progress}%
              </span>
            </div>
            {progress > 0 && progress < 100 && (
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '12px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-ghost" style={{ border: '1px solid var(--border-subtle)' }}>
            <RotateCcw size={16} /> 롤백 (Rollback)
          </button>
          <button className="btn btn-primary">
            <Rocket size={16} /> 새 버전 배포
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricsChart data={cpuData} dataKey="cpu" color="var(--primary)" title="CPU Usage (%)" />
        <MetricsChart data={memData} dataKey="mem" color="var(--success)" title="Memory Usage (%)" />
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-muted)' }}>실시간 시스템 로그</h3>
        <div className="logs-panel">
          {logs.map((log) => (
            <div key={log.id} className="log-entry">
              <span className="log-time">[{log.time}]</span>
              <span className={`log-message ${log.status}`}>{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Deployment;
