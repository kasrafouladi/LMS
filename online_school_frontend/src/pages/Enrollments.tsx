import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { cancelEnrollment } from '../api/index';
import { getStudentTranscript } from '../api/index';
import { listCourses } from '../api/courses';
import { ApiError } from '../api/client';

interface Props {
  onOpenCourse: (id: number) => void;
}

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }

export default function Enrollments({ onOpenCourse }: Props) {
  const { isStudent } = useAuth();

  const { data: transcript, loading: tLoad, refetch: refetchTranscript } = useApi(
    () => isStudent ? getStudentTranscript() : Promise.resolve([]), [isStudent]
  );
  const { data: upcomingCourses, loading: cLoad } = useApi(
    () => listCourses({ status: 'Upcoming' }), []
  );

  const myEnrollments = (transcript as any[]) ?? [];
  const enrolledCourseIds = new Set(myEnrollments.map((e: any) => e.CourseID));
  const availableCourses = ((upcomingCourses as any[]) ?? []).filter(c => !enrolledCourseIds.has(c.CourseID));
  const overallGPA = myEnrollments[0]?.GPA;

  async function handleCancel(enrollmentId: number) {
    if (!confirm('ثبت‌نام لغو شود؟ مبلغ پرداختی به صورت بازگشتی ثبت می‌شود.')) return;
    try {
      await cancelEnrollment(enrollmentId);
      refetchTranscript();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا در لغو ثبت‌نام');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ثبت‌نام‌های من</h1>
          <p className="page-subtitle">دوره‌هایی که در آن‌ها ثبت‌نام کرده‌اید و دوره‌های قابل ثبت‌نام</p>
        </div>
      </div>

      {/* My enrollments */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header">
          <span className="card-title">
            {tLoad ? 'در حال بارگذاری...' : `دوره‌های من (${myEnrollments.length})`}
          </span>
          {overallGPA != null && (
            <span className="badge badge-info" style={{ fontFamily: 'monospace', direction: 'ltr' }}>GPA کلی: {overallGPA}</span>
          )}
        </div>
        {tLoad ? (
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8 }} />)}
          </div>
        ) : myEnrollments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید</h3></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>دوره</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th>نمره نهایی</th><th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {myEnrollments.map((e: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{e.CourseTitle}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(e.EnrollmentDate)}</td>
                    <td>
                      <span className={`badge ${
                        e.EnrollmentStatus === 'Successful' ? 'badge-success' :
                        e.EnrollmentStatus === 'Pending' ? 'badge-warning' :
                        e.EnrollmentStatus === 'Dropped' ? 'badge-neutral' : 'badge-danger'
                      }`}>
                        {e.EnrollmentStatus}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', direction: 'ltr',textAlign: 'right' }}>{e.FinalScore != null ? `${e.FinalScore}/۲۰` : '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => onOpenCourse(e.CourseID)}>مشاهده دوره</button>
                        {(e.EnrollmentStatus === 'Successful' || e.EnrollmentStatus === 'Pending') && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(e.EnrollmentID)}>لغو ثبت‌نام</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available courses */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {cLoad ? 'در حال بارگذاری...' : `دوره‌های قابل ثبت‌نام (${availableCourses.length})`}
          </span>
        </div>
        {cLoad ? (
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>عنوان</th><th>مدرس</th><th>قیمت</th><th>ظرفیت</th><th>تاریخ شروع</th><th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {availableCourses.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📚</div><h3>دوره قابل ثبت‌نامی موجود نیست</h3></div></td></tr>
                ) : (
                  availableCourses.map((c: any) => (
                    <tr key={c.CourseID}>
                      <td style={{ fontWeight: 600 }}>{c.Title}</td>
                      <td>{c.TeacherName ?? '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'monospace', direction: 'ltr' }}>{(c.Price ?? 0).toLocaleString('fa-IR')} ت</td>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{c.EnrolledCount ?? 0}/{c.Capacity}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(c.StartDate)}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => onOpenCourse(c.CourseID)}>مشاهده و ثبت‌نام</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}