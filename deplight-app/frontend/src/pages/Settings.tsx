import { useState } from 'react';
import { Key, Globe, Cloud, ShieldAlert, Plus, Trash2 } from 'lucide-react';

interface Secret {
  id: string;
  key: string;
  value: string;
}

interface SettingsProps {
  onBack?: () => void;
}

const Settings = ({ onBack }: SettingsProps) => {
  const [secrets] = useState<Secret[]>([
    { id: '1', key: 'DATABASE_URL', value: 'postgresql://***' },
    { id: '2', key: 'API_KEY', value: 'sk-***' },
  ]);

  const [isGithubConnected, setIsGithubConnected] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onBack && (
          <button 
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 8px 0' }}>환경 설정</h1>
          <p style={{ color: '#64748B', margin: 0 }}>워크스페이스 환경과 보안 시크릿을 관리합니다.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }}>
        {/* Left Column: Secrets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Key style={{ color: 'var(--warning)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>시크릿 키 (Environment Variables)</h2>
              </div>
              <button className="btn btn-primary" style={{ padding: '6px 12px' }}>
                <Plus size={16} /> 새 키 추가
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {secrets.map(secret => (
                <div key={secret.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{secret.key}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{secret.value}</div>
                  </div>
                  <button className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '8px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Integrations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Cloud style={{ color: 'var(--info)' }} /> 연동 서비스
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Globe size={24} />
                <div>
                  <div style={{ fontWeight: 600 }}>GitHub 연동</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>자동 배포를 위한 권한</div>
                </div>
              </div>
              <button 
                className={`btn ${isGithubConnected ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => setIsGithubConnected(!isGithubConnected)}
              >
                {isGithubConnected ? '연결 해제' : '연결하기'}
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert /> 위험 구역 (Danger Zone)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              워크스페이스를 삭제하면 모든 배포된 앱과 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
              워크스페이스 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
