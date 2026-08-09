import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, ExternalLink, Download, Sprout, CheckCircle2, Moon, Loader2, AlertCircle, Bot } from 'lucide-react';
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

// 간단한 시간 변환 헬퍼 (예: "2시간 전")
const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "개월 전";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "분 전";
  return "방금 전";
};

const Deployment = ({ plant, onBack }: DeploymentProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cpuData, setCpuData] = useState<{time: string, cpu: number}[]>([]);
  const [memData, setMemData] = useState<{time: string, mem: number}[]>([]);
  const [currentPlant, setCurrentPlant] = useState<Plant>(plant);
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
          if (data.status) {
             const newStatus = data.status === 'success' ? 'HEALTHY' : 
                               data.status === 'failed' ? 'ERROR' : 'DEPLOYING';
             setCurrentPlant(prev => prev.status !== newStatus ? { ...prev, status: newStatus } : prev);
          }
          
          if (data.logs && Array.isArray(data.logs)) {
             if (data.logs.length > lastLogCount) {
               const newLogs = data.logs.slice(lastLogCount).map((l: any, i: number) => ({
                 id: Date.now().toString() + i,
                 time: new Date(l.timestamp || Date.now()).toLocaleTimeString(),
                 message: l.message,
                 status: l.type || 'log-info'
               }));
               setLogs(prev => [...prev, ...newLogs].slice(-200));
               lastLogCount = data.logs.length;
             }
          }
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentPlant.id]);

  const [chartData, setChartData] = useState<{time: string, cpu: number, mem: number}[]>([]);

  useEffect(() => {
    // Generate mock metrics for the chart over time
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'});
      const cpu = Math.floor(Math.random() * 20 + 35);
      const mem = Math.floor(Math.random() * 30 + 50);
      setChartData(prev => [...prev, { time, cpu, mem }].slice(-20));
      setCpuData(prev => [...prev, { time, cpu }].slice(-20)); // Keep for current values
      setMemData(prev => [...prev, { time, mem }].slice(-20));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const statusConfig = {
    HEALTHY: { label: '정상', icon: <CheckCircle2 size={14} />, className: 'status-healthy' },
    SLEEPING: { label: '겨울잠', icon: <Moon size={14} />, className: 'status-sleeping' },
    DEPLOYING: { label: '배포중', icon: <Loader2 size={14} className="animate-spin" />, className: 'status-deploying' },
    ERROR: { label: '오류', icon: <AlertCircle size={14} />, className: 'status-error' }
  };
  const currentStatus = statusConfig[currentPlant.status];

  // 더미 메트릭스 (현재 값)
  const currentCpu = cpuData.length > 0 ? cpuData[cpuData.length - 1].cpu : 45;
  const currentMem = memData.length > 0 ? memData[memData.length - 1].mem : 62;

  return (
    <div className="deployment-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> 대시보드로 돌아가기
      </button>

      {/* Top Grid: Header & Info */}
      <div className="deploy-grid">
        <div className="deploy-card">
          <div className="app-header-top">
            <div className="app-header-left">
              <div className="app-icon-large">
                <Sprout size={32} />
              </div>
              <div className="app-titles">
                <h1>{currentPlant.version}</h1>
                <p>{currentPlant.gitUrl || 'https://github.com/company/frontend-app'}</p>
                <a href="#" className="app-link">
                  <ExternalLink size={12} /> {currentPlant.gitUrl ? currentPlant.gitUrl.replace('https://github.com/', 'https://') + '.deplight.com' : 'https://frontend-app.deplight.com'}
                </a>
              </div>
            </div>
            <div className="app-header-right">
              <div className={`status-badge ${currentStatus.className}`}>
                {currentStatus.icon} {currentStatus.label}
              </div>
              <button className="btn-icon">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="usage-bars">
            <div className="usage-box">
              <div className="usage-header">
                <span className="text-blue">CPU 사용량</span>
                <span className="info-value">{currentCpu}%</span>
              </div>
              <div className="usage-progress">
                <div className="usage-fill bg-blue" style={{ width: `${currentCpu}%` }}></div>
              </div>
            </div>
            <div className="usage-box green-bg">
              <div className="usage-header">
                <span className="text-green">메모리 사용량</span>
                <span className="info-value">{currentMem}%</span>
              </div>
              <div className="usage-progress">
                <div className="usage-fill bg-green" style={{ width: `${currentMem}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="deploy-card">
          <h3 className="deploy-card-title">배포 정보</h3>
          <div className="info-row">
            <span className="info-label">마지막 배포</span>
            <span className="info-value">{timeAgo(currentPlant.updatedAt)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">배포 환경</span>
            <span className="info-value">Production</span>
          </div>
          <div className="info-row">
            <span className="info-label">인스턴스</span>
            <span className="info-value">2개</span>
          </div>
          <div className="info-row">
            <span className="info-label">리전</span>
            <span className="info-value">Asia-Northeast1</span>
          </div>
          
          <div className="info-actions">
            <button className="btn btn-primary btn-full">재배포</button>
            <button className="btn btn-secondary btn-full">설정</button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Metrics & Logs */}
      <div className="deploy-grid">
        <div className="deploy-card" style={{ padding: '0' }}>
          <div style={{ padding: '32px 32px 0' }}>
            <h3 className="deploy-card-title">실시간 메트릭</h3>
          </div>
          <MetricsChart data={chartData} title="" />
        </div>

        <div className="deploy-card terminal-card">
          <div className="terminal-header">
            <h3>실시간 로그</h3>
            <button className="btn-icon" style={{ border: 'none' }}>
              <Download size={16} />
            </button>
          </div>
          <div className="terminal-window">
            {logs.length === 0 ? (
              <span className="log-line log-system">[System] 로그 대기 중...</span>
            ) : (
              logs.map((log) => (
                <span key={log.id} className={`log-line ${log.status}`}>
                  [{log.time}] {log.message}
                </span>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="ai-insight-card">
        <div className="ai-icon">
          <Bot size={20} />
        </div>
        <div className="ai-text">
          <strong>AI 인사이트:</strong> 현재 앱의 성능이 안정적입니다. CPU 사용량이 평균 {currentCpu}%로 적정 수준이며, 메모리 사용량도 {currentMem}%로 양호합니다. 최근 24시간 동안 에러가 발생하지 않았으며, 응답 시간도 평균 150ms로 우수한 성능을 보이고 있습니다.
        </div>
      </div>
    </div>
  );
};

export default Deployment;
