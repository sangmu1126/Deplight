import { useState } from 'react';
import { CloudLightning, LogIn, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock login delay
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 800);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%), var(--bg-dark)' }}>
      <div className="glass-panel" style={{ width: '400px', padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
            <CloudLightning size={48} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Deplight V3</h1>
          <p style={{ color: 'var(--text-muted)' }}>가장 쉬운 컨테이너 배포 플랫폼</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>이메일</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="developer@example.com"
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', padding: '12px 12px 12px 40px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
              />
              <LogIn size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', padding: '12px 12px 12px 40px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
              />
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '14px', fontSize: '1rem', marginTop: '8px' }}
            disabled={isLoading}
          >
            {isLoading ? '인증 중...' : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>계정이 없으신가요? </span>
          <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>회원가입</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
