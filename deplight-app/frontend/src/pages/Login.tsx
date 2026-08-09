import { useState } from 'react';
import { Sprout } from 'lucide-react';
import './Login.css';

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
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo-box">
          <Sprout size={24} />
        </div>
        <h1 className="login-title">Deplight</h1>
        <p className="login-subtitle">PaaS 대시보드 플랫폼에 로그인하세요</p>
      </div>

      <div className="login-card">
        <form onSubmit={handleLogin}>
          <div className="login-form-group">
            <label>이메일</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="login-input"
            />
          </div>

          <div className="login-form-group">
            <label>비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="login-input"
            />
          </div>

          <div className="login-options">
            <label className="keep-login">
              <input type="checkbox" />
              로그인 상태 유지
            </label>
            <a href="#" className="forgot-pw">비밀번호 찾기</a>
          </div>

          <button 
            type="submit" 
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading ? '인증 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          계정이 없으신가요? <a href="#" className="signup-link">회원가입</a>
        </div>
      </div>
      
      <div className="login-meta-footer">
        Firebase 인증을 통한 안전한 로그인
      </div>
    </div>
  );
};

export default Login;
