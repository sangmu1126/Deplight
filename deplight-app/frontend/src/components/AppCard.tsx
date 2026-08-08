import { Globe, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import './AppCard.css';

export interface Plant {
  id: string;
  version: string;
  description?: string;
  status: 'HEALTHY' | 'DEPLOYING' | 'ERROR' | 'SLEEPING' | 'ROLLBACK';
  updatedAt: { _seconds: number; _nanoseconds: number } | Date | string;
  gitUrl?: string;
  plantType?: string;
}

interface AppCardProps {
  plant: Plant;
  onClick: () => void;
}

const AppCard: React.FC<AppCardProps> = ({ plant, onClick }) => {
  // Determine status color/badge
  let statusClass = 'sleeping';
  let statusText = 'Sleeping';
  
  switch (plant.status) {
    case 'HEALTHY':
      statusClass = 'healthy';
      statusText = 'Active';
      break;
    case 'DEPLOYING':
    case 'ROLLBACK':
      statusClass = 'deploying';
      statusText = 'Deploying';
      break;
    case 'ERROR':
      statusClass = 'error';
      statusText = 'Failed';
      break;
    default:
      statusClass = 'sleeping';
      statusText = 'Hibernated';
  }

  // Parse date
  let dateObj = new Date();
  if (plant.updatedAt) {
    if (typeof plant.updatedAt === 'string') {
      dateObj = new Date(plant.updatedAt);
    } else if ('_seconds' in plant.updatedAt) {
      dateObj = new Date(plant.updatedAt._seconds * 1000);
    } else if (plant.updatedAt instanceof Date) {
      dateObj = plant.updatedAt;
    }
  }

  const timeAgo = formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });

  // Select an emoji based on type
  const getEmoji = (type?: string) => {
    switch (type) {
      case 'rose': return '🌹';
      case 'sunflower': return '🌻';
      case 'cactus': return '🌵';
      case 'pot': return '🪴';
      default: return '📦';
    }
  };

  return (
    <div className="app-card glass-panel" onClick={onClick}>
      <div className="app-card-header">
        <div className="app-title-group">
          <div className="app-icon">
            {getEmoji(plant.plantType)}
          </div>
          <div>
            <h3 className="app-title">{plant.version}</h3>
            <div className="app-meta">
              <span className={`status-indicator ${statusClass}`}></span>
              <span>{statusText}</span>
            </div>
          </div>
        </div>
        {plant.status === 'HEALTHY' && (
          <span className="badge badge-success">Online</span>
        )}
        {plant.status === 'DEPLOYING' && (
          <span className="badge badge-warning">Building</span>
        )}
      </div>

      <div className="app-card-body">
        <p className="app-description">
          {plant.description || '앱에 대한 설명이 없습니다.'}
        </p>
      </div>

      <div className="app-card-footer">
        <div className="app-meta" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Globe size={14} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {plant.gitUrl ? plant.gitUrl.replace('https://github.com/', '') : 'N/A'}
          </span>
        </div>
        <div className="app-meta" style={{ minWidth: 'max-content' }}>
          <Clock size={14} />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

export default AppCard;
