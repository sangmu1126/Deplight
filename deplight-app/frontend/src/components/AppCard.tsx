import { CheckCircle2, Moon, Loader2, AlertCircle, Play, Sprout } from 'lucide-react';
import './AppCard.css';

export interface Plant {
  id: string;
  version: string;
  description: string;
  status: 'HEALTHY' | 'DEPLOYING' | 'ERROR' | 'SLEEPING';
  updatedAt: Date;
  gitUrl?: string;
  plantType: 'pot' | 'rose' | 'sunflower';
  branch?: string;
  aiInsight?: string;
}

interface AppCardProps {
  plant: Plant;
  onClick: () => void;
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

const AppCard = ({ plant, onClick }: AppCardProps) => {
  
  // Status config
  const statusConfig = {
    HEALTHY: { label: '정상', icon: <CheckCircle2 size={14} />, className: 'status-healthy' },
    SLEEPING: { label: '겨울잠', icon: <Moon size={14} />, className: 'status-sleeping' },
    DEPLOYING: { label: '배포중', icon: <Loader2 size={14} className="animate-spin" />, className: 'status-deploying' },
    ERROR: { label: '오류', icon: <AlertCircle size={14} />, className: 'status-error' }
  };

  const currentStatus = statusConfig[plant.status];

  // 더미 메트릭스 생성 (FastAPI 응답에 메트릭스가 아직 없으므로, 데모용으로 고정값 활용)
  // seed를 아이디로 사용하여 리렌더링시 값이 안바뀌게 만듦
  const idNum = parseInt(plant.id.replace(/\D/g, '') || '10');
  const cpuPercent = (idNum % 40) + 10; // 10 ~ 50%
  const memPercent = (idNum % 50) + 30; // 30 ~ 80%

  return (
    <div className="app-card" onClick={onClick}>
      <div className="app-card-header">
        <div className="app-icon">
          <Sprout size={24} />
        </div>
        <div className="app-title-group">
          <span className="app-title">{plant.version}</span>
          <span className="app-url" title={plant.gitUrl}>{plant.gitUrl || 'https://github.com/company/app'}</span>
        </div>
      </div>

      <div className="app-status-row">
        <div className={`status-badge ${currentStatus.className}`}>
          {currentStatus.icon}
          {currentStatus.label}
        </div>
        <span className="time-ago">{timeAgo(plant.updatedAt)}</span>
      </div>

      {plant.status === 'SLEEPING' ? (
        <div className="sleeping-state">
          <span className="sleeping-text">앱이 겨울잠 상태입니다</span>
          <button className="btn-wake" onClick={(e) => {
            e.stopPropagation();
            alert('깨우기 요청 전송!');
          }}>
            <Play size={14} fill="currentColor" /> 깨우기
          </button>
        </div>
      ) : plant.status === 'DEPLOYING' ? (
        <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          배포중...
        </div>
      ) : (
        <div className="app-metrics">
          <div className="metric-row">
            <div className="metric-header">
              <span>CPU</span>
              <span className="metric-value">{cpuPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill fill-cpu" style={{ width: `${cpuPercent}%` }} />
            </div>
          </div>
          <div className="metric-row">
            <div className="metric-header">
              <span>메모리</span>
              <span className="metric-value">{memPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill fill-mem" style={{ width: `${memPercent}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppCard;
