import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export type PageKey =
  | 'dashboard' | 'users' | 'students' | 'teachers'
  | 'courses' | 'enrollments' | 'assignments'
  | 'payments' | 'attendance' | 'certificates'
  | 'transcript' | 'announcements' | 'reports';

interface NavItem {
  id: PageKey;
  label: string;
  icon: string;
  roles?: ('Admin' | 'Teacher' | 'Student')[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'داشبورد',         icon: '📊' },
  { id: 'users',         label: 'کاربران',          icon: '👥',  roles: ['Admin'] },
  { id: 'students',      label: 'دانشجویان',        icon: '🎓',  roles: ['Admin', 'Teacher'] },
  { id: 'teachers',      label: 'مدرسان',           icon: '👨‍🏫', roles: ['Admin'] },
  { id: 'courses',       label: 'دوره‌ها',           icon: '📚' },
  { id: 'enrollments',   label: 'ثبت‌نام',           icon: '📋',  roles: ['Student'] },
  { id: 'transcript',    label: 'کارنامه',          icon: '📜',  roles: ['Student', 'Teacher', 'Admin'] },
  { id: 'assignments',   label: 'تکالیف',           icon: '📝' },
  { id: 'announcements', label: 'اطلاعیه‌ها',        icon: '📢' },
  { id: 'payments',      label: 'پرداخت‌ها',         icon: '💳' },
  { id: 'attendance',    label: 'حضور و غیاب',      icon: '✅' },
  { id: 'certificates',  label: 'گواهی‌نامه‌ها',     icon: '🏆' },
  { id: 'reports',       label: 'گزارش‌ها',          icon: '📈' }, // visible to ALL roles now
];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role as any);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🎓</span>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">سامانه آموزش</span>
              <span className="sidebar-logo-sub">آنلاین</span>
            </div>
          )}
        </div>
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {visibleItems.map(item => (
            <li key={item.id}>
              <button
                className={`sidebar-item ${activePage === item.id ? 'sidebar-item--active' : ''}`}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user?.fullname?.charAt(0) ?? 'U'}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.fullname ?? 'کاربر'}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
            <button onClick={logout} title="خروج" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: '1rem', marginRight: 'auto' }}>
              ↩
            </button>
          </div>
        ) : (
          <button onClick={logout} title="خروج" className="sidebar-item" style={{ width: '100%', justifyContent: 'center' }}>
            <span className="sidebar-item-icon">↩</span>
          </button>
        )}
      </div>
    </aside>
  );
}