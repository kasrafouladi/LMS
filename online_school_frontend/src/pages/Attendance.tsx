import { useState } from 'react';
import { attendanceBadge } from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { reportAttendance } from '../api/index';
import { getStudentTranscript } from '../api/index';
import { listCourses } from '../api/courses';

export default function Attendance() {
  const { user, isTeacher, isAdmin, isStudent } = useAuth();
  const [courseId, setCourseId] = useState<number>(0);
  const [studentId, setStudentId] = useState<number>(user ? parseInt(user.sub) : 0);
  const [searched, setSearched] = useState(false);

  // برای دانشجو: دریافت دوره‌هایی که ثبت‌نام موفق دارد
  const { data: transcript } = useApi(() => isStudent ? getStudentTranscript() : Promise.resolve([]), [isStudent]);
  const enrolledCourses = (transcript as any[])
    ?.filter((e: any) => e.EnrollmentStatus === 'Successful')
    .map((e: any) => ({ CourseID: e.CourseID, Title: e.CourseTitle })) ?? [];

  // برای معلم: فقط دوره‌های خودش (با ارسال teacher_id)
  const { data: myCourses } = useApi(() => (isTeacher && !isAdmin) ? listCourses({ teacher_id: Number(user?.sub) }) : Promise.resolve([]), [isTeacher, isAdmin, user]);
  // برای ادمین: همه دوره‌ها
  const { data: allCourses } = useApi(() => isAdmin ? listCourses() : Promise.resolve([]), [isAdmin]);
  
  let courseList: any[] = [];
  if (isStudent) {
    courseList = enrolledCourses;
  } else if (isTeacher && !isAdmin) {
    courseList = (myCourses as any[]) ?? [];
  } else if (isAdmin) {
    courseList = (allCourses as any[]) ?? [];
  }

  const { data: records, loading, error } = useApi(
    () => (searched && courseId && studentId) ? reportAttendance(studentId, courseId) : Promise.resolve([]),
    [searched, courseId, studentId]
  );

  const list = (records as any[]) ?? [];
  const presentCount = list.filter(r => r.Status === 'Present').length;
  const pct = list.length ? Math.round((presentCount / list.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">حضور و غیاب</h1>
          <p className="page-subtitle">
            {isStudent ? 'مشاهده سابقه حضور شما در دوره‌ها' : 'مشاهده سابقه حضور دانشجویان (ثبت حضور از صفحه جزئیات دوره)'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">دوره</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(+e.target.value)}>
              <option value={0}>انتخاب کنید...</option>
              {courseList.map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
            </select>
          </div>
          {(isAdmin || isTeacher) && (
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label">شناسه دانشجو</label>
              <input className="form-input" type="number" value={studentId} onChange={e => setStudentId(+e.target.value)} dir="ltr" />
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setSearched(true)} disabled={!courseId || !studentId}>
            مشاهده
          </button>
        </div>
      </div>

      {searched && !loading && list.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--brand-600)', fontFamily: 'monospace', direction: 'ltr' }}>{pct}٪</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>درصد حضور</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-sm)' }}>
                <span>حاضر: <strong style={{ color: 'var(--color-success)', fontFamily: 'monospace', direction: 'ltr' }}>{presentCount}</strong></span>
                <span>غایب: <strong style={{ color: 'var(--color-danger)', fontFamily: 'monospace', direction: 'ltr' }}>{list.length - presentCount}</strong></span>
              </div>
              <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-success)', borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {searched && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">سوابق ({list.length})</span>
          </div>
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-400)' }}>در حال بارگذاری...</div>
          ) : error ? (
            <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{error}</h3></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={2}>
                        <div className="empty-state">
                          <div className="empty-icon">✅</div>
                          <h3>سابقه‌ای یافت نشد</h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    list.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                          {r.SessionDate ? new Date(r.SessionDate).toLocaleDateString('fa-IR') : '—'}
                        </td>
                        <td>{attendanceBadge(r.Status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>یک دوره را انتخاب کنید</h3>
          <p style={{ color: 'var(--gray-400)', marginTop: 4 }}>
            {isAdmin || isTeacher ? 'برای ثبت حضور جدید، به صفحه جزئیات دوره مراجعه کنید' : 'برای مشاهده سابقه حضور خود، دوره را انتخاب و روی «مشاهده» کلیک کنید'}
          </p>
        </div>
      )}
    </div>
  );
}