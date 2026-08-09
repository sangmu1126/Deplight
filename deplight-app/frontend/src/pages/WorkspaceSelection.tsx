import { FolderGit2, ArrowRight } from 'lucide-react';

interface WorkspaceSelectionProps {
  onSelect: (workspaceId: string) => void;
}

const WorkspaceSelection = ({ onSelect }: WorkspaceSelectionProps) => {
  const workspaces = [
    { id: 'ws-1', name: 'Deplight V3 Core', role: 'Owner' },
    { id: 'ws-2', name: 'Personal Projects', role: 'Admin' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '480px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>워크스페이스 선택</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px' }}>작업할 워크스페이스를 선택해주세요.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {workspaces.map(ws => (
            <div 
              key={ws.id} 
              className="glass-panel"
              style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => onSelect(ws.id)}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                  <FolderGit2 size={24} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{ws.name}</h3>
                  <span className="badge badge-primary">{ws.role}</span>
                </div>
              </div>
              <ArrowRight color="var(--text-muted)" />
            </div>
          ))}
        </div>

        <button className="btn btn-ghost" style={{ width: '100%', padding: '16px', marginTop: '24px', border: '1px dashed var(--border-subtle)' }}>
          + 새 워크스페이스 만들기
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSelection;
