import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Rocket, Globe, Activity } from 'lucide-react';
import MetricsChart from '../components/MetricsChart';
import type { Plant } from '../components/AppCard';
import type { Socket } from 'socket.io-client';
import './Deployment.css';

interface DeploymentProps {
  plant: Plant;
  onBack: () => void;
  socket: Socket | null;
}

interface LogEntry {
  id: string;
  time: string;
  message: string;
  status: string;
}

const Deployment = ({ plant, onBack, socket }: DeploymentProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cpuData, setCpuData] = useState<{time: string, cpu: number}[]>([]);
  const [memData, setMemData] = useState<{time: string, mem: number}[]>([]);
  const [currentPlant, setCurrentPlant] = useState<Plant>(plant);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const timeCounterRef = useRef(1);

  useEffect(() => {
    if (!socket) return;

    const onStatusUpdate = (data: any) => {
      if (data.id === currentPlant.id) {
        setCurrentPlant(prev => ({ ...prev, status: data.status }));
      }
    };

    const onNewLog = (data: any) => {
      if (data.id === currentPlant.id) {
        setLogs(prev => {
          const newLogs = [...prev, {
            id: Date.now().toString(),
            time: new Date(data.log.time || Date.now()).toLocaleTimeString(),
            message: data.log.message,
            status: data.log.status || 'info'
          }];
          return newLogs.slice(-200); // keep last 200 logs
        });
      }
    };

    const onMetricsUpdate = (data: any) => {
      const time = new Date().toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'});
      
      setCpuData(prev => {
        const next = [...prev, { time, cpu: data.cpu }];
        return next.slice(-20);
      });
      
      setMemData(prev => {
        const memPercent = (data.mem / 2.56); // Normalizing MB to %
        const next = [...prev, { time, mem: memPercent }];
        return next.slice(-20);
      });
      
      timeCounterRef.current += 1;
    };

    socket.on('status-update', onStatusUpdate);
    socket.on('new-log', onNewLog);
    socket.on('metrics-update', onMetricsUpdate);

    // Initial requests
    socket.emit('get-logs-for-plant', currentPlant.id);
    
    // In original code, runId is needed for metrics, mock it for now if missing
    // socket.emit('get-deployment-metrics', { runId: currentPlant.runId });

    return () => {
      socket.off('status-update', onStatusUpdate);
      socket.off('new-log', onNewLog);
      socket.off('metrics-update', onMetricsUpdate);
    };
  }, [socket, currentPlant.id]);

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
