import { LogOut, User, Users, Building2, Users2, Clock, ArrowRight } from 'lucide-react';
import './WorkspaceSelection.css';

interface WorkspaceSelectionProps {
  onSelect: (workspaceId: string) => void;
}

const WorkspaceSelection = ({ onSelect }: WorkspaceSelectionProps) => {
  const workspaces = [
    { 
      id: 'ws-default', 
      name: 'Default', 
      subname: 'Workspace', 
      type: '개인', 
      icon: <User size={24} />, 
      desc: '개인 프로젝트를 위한 기본 워크스페이스',
      members: 1,
      date: '2024-01-15'
    },
    { 
      id: 'ws-dev', 
      name: 'Development', 
      subname: 'Team', 
      type: '팀', 
      icon: <Users size={24} />, 
      desc: '개발팀 협업을 위한 워크스페이스',
      members: 8,
      date: '2024-01-14'
    },
    { 
      id: 'ws-prod', 
      name: 'Production', 
      subname: 'Team', 
      type: '기업', 
      icon: <Building2 size={24} />, 
      desc: '운영팀 관리를 위한 워크스페이스',
      members: 15,
      date: '2024-01-10'
    },
  ];

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div className="workspace-logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <span>Deplight</span>
        </div>
        <button className="logout-btn">
          <LogOut size={16} /> 로그아웃
        </button>
      </header>

      <main className="workspace-content">
        <h1 className="workspace-title">워크스페이스 선택</h1>
        <p className="workspace-subtitle">작업할 워크스페이스를 선택하거나 새로운 워크스페이스를 생성하세요</p>

        <div className="workspace-actions">
          <button className="btn-new-workspace">
            + 새 워크스페이스 생성
          </button>
        </div>

        <div className="workspace-grid">
          {workspaces.map(ws => (
            <div key={ws.id} className="workspace-card" onClick={() => onSelect(ws.id)}>
              <div className="card-header">
                <div className="card-icon-container">
                  <div className="card-icon">
                    {ws.icon}
                  </div>
                  <div className="card-title-group">
                    <span className="card-title">{ws.name}</span>
                    <span className="card-title">{ws.subname}</span>
                    <span className="card-tag">{ws.type}</span>
                  </div>
                </div>
                <div className="status-dot"></div>
              </div>
              
              <p className="card-desc">{ws.desc}</p>
              
              <div className="card-footer">
                <div className="footer-info">
                  <div className="footer-item">
                    <Users2 size={14} />
                    <span>{ws.members}명</span>
                  </div>
                  <div className="footer-item">
                    <Clock size={14} />
                    <span>{ws.date}</span>
                  </div>
                </div>
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceSelection;
