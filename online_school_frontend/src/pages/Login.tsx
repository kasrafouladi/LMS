import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import './Login.css';

interface LoginPageProps {
  onShowRegister: () => void;
}
export default function LoginPage({ onShowRegister }: LoginPageProps) {  
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Background shapes */}
      <div className="login-bg-shape login-bg-shape--1" />
      <div className="login-bg-shape login-bg-shape--2" />

      <div className="login-card animate-scale-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1 className="login-title">سامانه مدیریت آموزشگاه</h1>
          <p className="login-subtitle">برای ادامه وارد حساب خود شوید</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error animate-fade-in">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">ایمیل</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@edu.ir"
              dir="ltr"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">رمز عبور</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'ورود به سیستم'
            )}
          </button>
        </form>

        <div className="login-hint">
          <span>حساب کاربری ندارید؟ </span>
          <a href="#" onClick={e => { e.preventDefault(); onShowRegister(); }} style={{ color: 'var(--brand-400)', fontWeight: 600 }}>
           ثبت‌نام کنید
          </a>
        </div>
      </div>
    </div>
  );
}
