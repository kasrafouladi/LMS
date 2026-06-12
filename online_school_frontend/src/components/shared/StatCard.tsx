// components/shared/StatCard.tsx
import type { StatCardData } from '../../types';

export default function StatCard({ title, value, icon, trend, color }: StatCardData) {
  // تنظیم رنگ بر اساس props
  const colorClasses = {
    blue: 'stat-icon-blue',
    green: 'stat-icon-green',
    amber: 'stat-icon-amber',
    violet: 'stat-icon-violet',
    rose: 'stat-icon-rose',
    teal: 'stat-icon-teal',
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClasses[color as keyof typeof colorClasses] || ''}`}>
        {icon}
      </div>
      <div className="stat-body">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {trend != null && (
          <div className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            <span className="trend-arrow">{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}% نسبت به ماه قبل</span>
          </div>
        )}
      </div>
    </div>
  );
}