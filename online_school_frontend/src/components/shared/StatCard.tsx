import type { StatCardData } from '../../types';

export default function StatCard({ title, value, icon, trend, color }: StatCardData) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {trend != null && (
          <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}٪ نسبت به ماه قبل</span>
          </div>
        )}
      </div>
    </div>
  );
}
