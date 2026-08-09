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
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Mock real-time data generation
  useEffect(() => {
    // Generate initial chart data
    const now = new Date();
    const initialCpu = Array.from({length: 20}).map((_, i) => ({
      time: new Date(now.getTime() - (20 - i) * 2000).toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'}),
      cpu: Math.random() * 20 + 5
    }));
    const initialMem = Array.from({length: 20}).map((_, i) => ({
      time: new Date(now.getTime() - (20 - i) * 2000).toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'}),
      mem: Math.random() * 30 + 40
    }));
    
    setCpuData(initialCpu);
    setMemData(initialMem);

    // Initial Logs
    setLogs([
      { id: '1', time: now.toLocaleTimeString(), message: 'System initialized. Fetching deployment state...', status: 'info' },
      { id: '2', time: now.toLocaleTimeString(), message: `Connected to plant instance ${plant.id}`, status: 'success' },
    ]);

    // Interval for updates
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'});
      
      setCpuData(prev => {
        const next = [...prev.slice(1), { time, cpu: Math.random() * 20 + (plant.status === 'DEPLOYING' ? 60 : 5) }];
        return next;
      });
      
      setMemData(prev => {
        const next = [...prev.slice(1), { time, mem: Math.random() * 10 + (plant.status === 'DEPLOYING' ? 70 : 40) }];
        return next;
      });

      if (Math.random() > 0.7) {
        setLogs(prev => {
          const statuses = ['info', 'info', 'success', 'error', 'ai'];
          const newLog = {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            message: `[${plant.status}] Heartbeat check completed. Latency ${Math.floor(Math.random() * 50)}ms`,
            status: statuses[Math.floor(Math.random() * statuses.length)]
          };
          return [...prev, newLog].slice(-100);
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [plant]);

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
            <h1 className="deployment-title">{plant.version}</h1>
            <div className="deployment-meta">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={14} /> ID: {plant.id.substring(0, 8)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={14} /> {plant.gitUrl || 'N/A'}
              </span>
            </div>
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
