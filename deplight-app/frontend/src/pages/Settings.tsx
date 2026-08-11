import { useState } from 'react';
import { Key, Globe, Cloud, ShieldAlert, Save } from 'lucide-react';
import { getDashboardApiKey, setDashboardApiKey } from '../api';

interface SettingsProps {
  onBack?: () => void;
}

const Settings = ({ onBack }: SettingsProps) => {
  const [apiKey, setApiKey] = useState(getDashboardApiKey);
  const [saved, setSaved] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(true);

  const saveApiKey = () => {
    setDashboardApiKey(apiKey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

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
        {/* Left Column: Dashboard API access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Key style={{ color: 'var(--warning)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>배포 API 키</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              조회 기능에는 필요하지 않습니다. 새 배포와 재배포를 실행할 때만 사용하며 현재 브라우저 세션에만 저장됩니다.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setSaved(false);
                }}
                placeholder="Dashboard API key"
                autoComplete="off"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255,255,255,0.8)',
                  color: 'var(--text-main)'
                }}
              />
              <button className="btn btn-primary" onClick={saveApiKey}>
                <Save size={16} /> {saved ? '저장됨' : '세션에 저장'}
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert style={{ color: 'var(--warning)' }} />
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>로그인 없이 사용 중</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    Dashboard 조회 화면은 공개되어 있습니다.
                  </p>
                </div>
              </div>
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
