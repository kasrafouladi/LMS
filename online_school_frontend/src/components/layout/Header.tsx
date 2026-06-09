import { useAuth } from '../../context/AuthContext';
import './Header.css';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'داشبورد', users: 'مدیریت کاربران', students: 'دانشجویان',
  teachers: 'مدرسان', courses: 'دوره‌ها', enrollments: 'ثبت‌نام‌ها',
  assignments: 'تکالیف', payments: 'پرداخت‌ها', attendance: 'حضور و غیاب',
  certificates: 'گواهی‌نامه‌ها',
};

const ROLE_LABEL: Record<string, string> = { Admin: 'مدیر', Teacher: 'مدرس', Student: 'دانشجو' };

export default function Header({ activePage }: { activePage: string }) {
  const { user, logout } = useAuth();

  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-right">
        <h1 className="header-title">{PAGE_TITLES[activePage] ?? activePage}</h1>
        <span className="header-date">{today}</span>
      </div>

      <div className="header-left">
        {user && (
          <div className="header-user-info">
            <span className="badge badge-info">{ROLE_LABEL[user.role] ?? user.role}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>{user.fullname}</span>
          </div>
        )}
        <button className="header-avatar" onClick={logout} title="خروج">
          {user?.fullname?.charAt(0) ?? 'U'}
        </button>
      </div>
    </header>
  );
}
