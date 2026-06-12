import { useState } from 'react';
import { register } from '../api/auth';
import { ApiError } from '../api/client';
import './Login.css';

interface RegisterPageProps {
  onSuccess: () => void; // برگشت به صفحه لاگین بعد از ثبت‌نام موفق
  onBackToLogin: () => void;
}

export default function RegisterPage({ onSuccess, onBackToLogin }: RegisterPageProps) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'Student' as 'Student' | 'Teacher',
    phone_number: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm_password) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    if (form.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone_number: form.phone_number || undefined,
        date_of_birth: form.role === 'Student' && form.date_of_birth ? form.date_of_birth : undefined,
      });
      setSuccess(true);
      setTimeout(() => onSuccess(), 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-shape login-bg-shape--1" />
      <div className="login-bg-shape login-bg-shape--2" />

      <div className="login-card animate-scale-in" style={{ maxWidth: 460 }}>
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1 className="login-title">ایجاد حساب کاربری</h1>
          <p className="login-subtitle">برای استفاده از سامانه ثبت‌نام کنید</p>
        </div>

        {success ? (
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--color-success-bg)',
              color: '#065f46',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
            }}
          >
            ✅ ثبت‌نام با موفقیت انجام شد! در حال انتقال به صفحه ورود...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error animate-fade-in">⚠️ {error}</div>}

            <div className="form-group">
              <label className="form-label">نام کامل *</label>
              <input
                className="form-input"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="نام و نام خانوادگی"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">ایمیل *</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="example@edu.ir"
                dir="ltr"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">رمز عبور *</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">تکرار رمز عبور *</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.confirm_password}
                  onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">نوع حساب</label>
              <select
                className="form-select"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'Student' | 'Teacher' }))}
              >
                <option value="Student">دانشجو</option>
                <option value="Teacher">مدرس</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: form.role === 'Student' ? '1fr 1fr' : '1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">شماره تلفن</label>
                <input
                  className="form-input"
                  value={form.phone_number}
                  onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              {form.role === 'Student' && (
                <div className="form-group">
                  <label className="form-label">تاریخ تولد</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                    dir="ltr"
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'ثبت‌نام'}
            </button>
          </form>
        )}

        <div className="login-hint">
          <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
          <a
            href="#"
            onClick={e => { e.preventDefault(); onBackToLogin(); }}
            style={{ color: 'var(--brand-400)', fontWeight: 600 }}
          >
            ورود به سیستم
          </a>
        </div>
      </div>
    </div>
  );
}
