import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { reportTopStudents, reportPopularCourses, getFinancialSummary, getCourseStatistics, getStudentTranscript } from '../api/index';
import { getMyGrades, getMyPayments } from '../api/users';
import StatCard from '../components/shared/StatCard';
import './Dashboard.css';

function Skeleton({ h = 44 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 8, marginBottom: 10 }} />;
}

interface Props {
  onOpenCourse: (id: number) => void;
}

export default function Dashboard({ onOpenCourse }: Props) {
  const { isAdmin, isTeacher, isStudent, user } = useAuth();

  const { data: topStudents, loading: tsLoad } = useApi(() => reportTopStudents(5), []);
  const { data: popularCourses, loading: pcLoad } = useApi(() => reportPopularCourses(), []);

  const canSeeFinancial = isAdmin;
  const canSeeCourseStats = isAdmin || isTeacher;

  const { data: financial, loading: finLoad } = useApi(() =>
    canSeeFinancial ? getFinancialSummary() : Promise.resolve([]), [canSeeFinancial]);

  const { data: courseStats } = useApi(() =>
    canSeeCourseStats ? getCourseStatistics() : Promise.resolve([]), [canSeeCourseStats]);

  const { data: transcript, loading: transLoad } = useApi(() =>
    isStudent ? getStudentTranscript() : Promise.resolve([]), [isStudent]);

  const { data: grades, loading: gradesLoad } = useApi(() =>
    isStudent ? getMyGrades() : Promise.resolve({ courses: [], assignments: [] }), [isStudent]);

  const { data: payments } = useApi(() =>
    isStudent ? getMyPayments() : Promise.resolve([]), [isStudent]);

  const finList = (financial as any[]) ?? [];
  const totalIncome = finList.reduce((s: number, r: any) => s + (r.SuccessfulAmount ?? r.TotalIncome ?? r.Amount ?? 0), 0);
  const courseList = (courseStats as any[]) ?? [];
  const popularList = (popularCourses as any[]) ?? [];
  const topList = (topStudents as any[]) ?? [];

  const myEnrollments = (transcript as any[]) ?? [];
  const myGrades = (grades as any) ?? { courses: [], assignments: [] };
  const myPayments = (payments as any[]) ?? [];

  // Shared widgets: Top students + Popular courses (visible to everyone)
  const topStudentsCard = (
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
                  <td style={{ fontWeight: 800, color: 'var(--brand-600)', fontFamily: 'monospace', direction: 'ltr' }}>{s.GPA}/۲۰</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const popularCoursesCard = (
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
            const stat = courseList.find((cs: any) => cs.CourseID === c.CourseID);
            const capacity = stat?.Capacity;
            const enrolled = c.SuccessfulEnrollments ?? 0;
            const pct = capacity ? Math.round((enrolled / capacity) * 100) : 0;
            return (
              <div
                key={c.CourseID ?? i}
                className="course-progress-item"
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenCourse(c.CourseID)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.Title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{c.Status}</div>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', fontWeight: 600, fontFamily: 'monospace', direction: 'ltr' }}>
                    {enrolled}{capacity ? `/${capacity}` : ''}
                  </span>
                </div>
                {capacity != null && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--color-warning)' : 'var(--brand-500)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Student dashboard ────────────────────────────────────────────────────
  if (isStudent) {
    const successfulEnrollments = myEnrollments.filter((e: any) => e.EnrollmentStatus === 'Successful');
    const pendingAssignments = (myGrades.assignments ?? []).filter((a: any) => a.Score == null).length;
    const gpa = myEnrollments[0]?.GPA;
    const totalPaid = myPayments.filter((p: any) => p.Status === 'Successful').reduce((s: number, p: any) => s + (p.Amount ?? 0), 0);

    return (
      <div className="dashboard">
        <div className="stats-grid">
          <StatCard title="دوره‌های فعال" value={successfulEnrollments.length || '—'} icon="📚" color="blue" />
          <StatCard title="میانگین معدل (GPA)" value={gpa != null ? `${gpa}/۲۰` : '—'} icon="⭐" color="violet" />
          <StatCard title="تکالیف منتظر نمره" value={pendingAssignments} icon="📝" color="amber" />
          <StatCard title="مجموع پرداختی" value={totalPaid.toLocaleString('fa-IR') + ' ت'} icon="💰" color="green" />
          <StatCard title="خوش‌آمدید" value={user?.fullname ?? '—'} icon="👋" color="teal" />
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header">
            <h2 className="card-title">دوره‌های من</h2>
          </div>
          {transLoad ? (
            <div style={{ padding: 'var(--space-4)' }}>{[1,2,3].map(i => <Skeleton key={i} />)}</div>
          ) : myEnrollments.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📚</div><h3>هنوز در دوره‌ای ثبت‌نام نکرده‌اید</h3></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>دوره</th><th>وضعیت</th><th>نمره نهایی</th><th>عملیات</th></tr></thead>
                <tbody>
                  {myEnrollments.map((e: any, i: number) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => onOpenCourse(e.CourseID)}>
                      <td style={{ fontWeight: 600 }}>{e.CourseTitle}</td>
                      <td>
                        <span className={`badge ${e.EnrollmentStatus === 'Successful' ? 'badge-success' : e.EnrollmentStatus === 'Pending' ? 'badge-warning' : 'badge-neutral'}`}>
                          {e.EnrollmentStatus}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{e.FinalScore != null ? `${e.FinalScore}/۲۰` : '—'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onOpenCourse(e.CourseID); }}>
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          {topStudentsCard}
          {popularCoursesCard}
        </div>

        {!gradesLoad && (myGrades.assignments ?? []).length > 0 && (
          <div className="card" style={{ marginTop: 'var(--space-5)' }}>
            <div className="card-header"><h2 className="card-title">آخرین تکالیف</h2></div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>تکلیف</th><th>دوره</th><th>نمره</th></tr></thead>
                <tbody>
                  {myGrades.assignments.slice(0, 5).map((a: any, i: number) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => onOpenCourse(a.CourseID)}>
                      <td style={{ fontWeight: 600 }}>{a.AssignmentTitle}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{a.CourseTitle}</td>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>
                        {a.Score != null ? <strong>{a.Score}/۲۰</strong> : <span className="badge badge-warning">تصحیح نشده</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Admin / Teacher dashboard ────────────────────────────────────────────
  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard title="دوره‌های فعال" value={courseList.filter((c:any) => c.Status === 'Active').length || '—'} icon="📚" color="blue" />
        <StatCard title="کل دوره‌ها" value={courseList.length || '—'} icon="🎓" color="green" />
        {isAdmin && <StatCard title="درآمد کل" value={totalIncome ? totalIncome.toLocaleString('fa-IR') + ' ت' : '—'} icon="💰" color="amber" />}
        <StatCard title="برترین دانشجو GPA" value={topList[0] ? `${topList[0].GPA ?? topList[0].FullName}` : '—'} icon="⭐" color="violet" />
        <StatCard title="پرطرفدارترین دوره" value={popularList[0]?.Title ?? '—'} icon="🔥" color="rose" />
        <StatCard title="خوش‌آمدید" value={user?.fullname ?? '—'} icon="👋" color="teal" />
      </div>

      <div className="dashboard-grid">
        {topStudentsCard}
        {popularCoursesCard}
      </div>
    </div>
  );
}