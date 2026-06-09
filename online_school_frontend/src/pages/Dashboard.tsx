import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { reportTopStudents, reportPopularCourses, getFinancialSummary, getCourseStatistics } from '../api/index';
import StatCard from '../components/shared/StatCard';
import './Dashboard.css';

function Skeleton({ h = 44 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 8, marginBottom: 10 }} />;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  Successful: { label: 'موفق',      cls: 'badge badge-success' },
  Pending:    { label: 'در انتظار', cls: 'badge badge-warning' },
  Failed:     { label: 'ناموفق',    cls: 'badge badge-danger'  },
};

export default function Dashboard() {
  const { isAdmin, isTeacher, user } = useAuth();

  const canSeeReports = isAdmin || isTeacher;

  const { data: topStudents, loading: tsLoad } = useApi(() =>
    canSeeReports ? reportTopStudents(5) : Promise.resolve([]), [canSeeReports]);

  const { data: popularCourses, loading: pcLoad } = useApi(() =>
    canSeeReports ? reportPopularCourses() : Promise.resolve([]), [canSeeReports]);

  const { data: financial, loading: finLoad } = useApi(() =>
    isAdmin ? getFinancialSummary() : Promise.resolve([]), [isAdmin]);

  const { data: courseStats, loading: csLoad } = useApi(() =>
    canSeeReports ? getCourseStatistics() : Promise.resolve([]), [canSeeReports]);

  const finList = (financial as any[]) ?? [];
  const totalIncome = finList.reduce((s: number, r: any) => s + (r.TotalIncome ?? r.Amount ?? 0), 0);
  const courseList = (courseStats as any[]) ?? [];
  const popularList = (popularCourses as any[]) ?? [];
  const topList = (topStudents as any[]) ?? [];

  return (
    <div className="dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="دوره‌های فعال"      value={courseList.filter((c:any) => c.Status === 'Active').length || '—'} icon="📚" color="blue" />
        <StatCard title="کل دوره‌ها"         value={courseList.length || '—'} icon="🎓" color="green" />
        {isAdmin && <StatCard title="درآمد کل" value={totalIncome ? totalIncome.toLocaleString('fa-IR') + ' ت' : '—'} icon="💰" color="amber" />}
        <StatCard title="برترین دانشجو GPA"  value={topList[0] ? `${topList[0].GPA ?? topList[0].FullName}` : '—'} icon="⭐" color="violet" />
        <StatCard title="پرطرفدارترین دوره"  value={popularList[0]?.Title ?? '—'} icon="🔥" color="rose" />
        <StatCard title="خوش‌آمدید"          value={user?.fullname ?? '—'} icon="👋" color="teal" />
      </div>

      <div className="dashboard-grid">
        {/* Top students */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">برترین دانشجویان</h2>
            <span className="badge badge-info">بر اساس GPA</span>
          </div>
          {tsLoad ? (
            <div style={{ padding: 'var(--space-4)' }}>{[1,2,3,4,5].map(i => <Skeleton key={i} />)}</div>
          ) : topList.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎓</div><h3>داده‌ای موجود نیست</h3></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>رتبه</th><th>نام</th><th>GPA</th></tr></thead>
                <tbody>
                  {topList.map((s: any, i: number) => (
                    <tr key={s.StudentID ?? i}>
                      <td style={{ color: i < 3 ? 'var(--accent-amber)' : 'var(--gray-400)', fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.FullName}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand-600)' }}>{s.GPA}/۲۰</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Popular courses */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">پرطرفدارترین دوره‌ها</h2>
          </div>
          {pcLoad ? (
            <div style={{ padding: 'var(--space-4)' }}>{[1,2,3,4].map(i => <Skeleton key={i} h={60} />)}</div>
          ) : popularList.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📚</div><h3>داده‌ای موجود نیست</h3></div>
          ) : (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {popularList.slice(0, 5).map((c: any, i: number) => {
                const pct = c.Capacity ? Math.round(((c.EnrolledCount ?? c.StudentCount ?? 0) / c.Capacity) * 100) : 0;
                return (
                  <div key={c.CourseID ?? i} className="course-progress-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.Title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{c.TeacherName ?? ''}</div>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', fontWeight: 600 }}>
                        {c.EnrolledCount ?? c.StudentCount ?? 0}/{c.Capacity ?? '?'}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--color-warning)' : 'var(--brand-500)' }} />
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 3 }}>{pct}٪ پر شده</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
