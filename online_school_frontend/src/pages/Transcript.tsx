import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getStudentTranscript } from '../api/index';
import { listCourses } from '../api/courses';

interface Props {
  onOpenCourse: (id: number) => void;
}

export default function Transcript({ onOpenCourse }: Props) {
  const { isStudent, isAdmin, isTeacher, user } = useAuth();
  const [studentFilter, setStudentFilter] = useState<number | ''>('');

  const { data: transcript, loading, error } = useApi(() => getStudentTranscript(), []);
  const { data: myCourses } = useApi(() => (isTeacher ? listCourses({ teacher_id: Number(user?.sub) }) : Promise.resolve([])), [isTeacher, user]);

  let list = (transcript as any[]) ?? [];

  // محدود کردن دسترسی معلم به دانشجویان دوره‌های خودش
  if (isTeacher && !isAdmin && myCourses) {
    const myCourseIds = (myCourses as any[]).map(c => c.CourseID);
    list = list.filter(row => myCourseIds.includes(row.CourseID));
    // همچنین اگر می‌خواهیم فقط دانشجویان منحصربه‌فرد را در dropdown نشان دهیم
    // ولی برای سادگی، dropdown را حذف کرده و همه رکوردهای فیلتر شده را نمایش می‌دهیم
  }

  // برای ادمین، dropdown از همه دانشجویان (با استفاده از listUsers قبلی)
  // اما برای سادگی و با توجه به محدودیت، فعلاً همان لیست فیلتر شده را نشان می‌دهیم
  // در صورت نیاز به dropdown برای ادمین، می‌توان از listUsers استفاده کرد

  // Group by student for admin/teacher view
  const grouped: Record<string, any[]> = {};
  if (!isStudent) {
    for (const row of list) {
      const key = `${row.StudentID}::${row.FullName}`;
      (grouped[key] ??= []).push(row);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">کارنامه تحصیلی</h1>
          <p className="page-subtitle">
            {isStudent ? 'سوابق تحصیلی و نمرات شما در همه دوره‌ها' : 'سوابق تحصیلی دانشجویان'}
          </p>
        </div>
        {isAdmin && !isTeacher && (
          <select className="form-select" style={{ width: 220 }} value={studentFilter} onChange={e => setStudentFilter(e.target.value ? +e.target.value : '')}>
            <option value="">همه دانشجویان</option>
            {/* در صورت نیاز می‌توان لیست دانشجویان را از api گرفت */}
          </select>
        )}
        {isTeacher && !isAdmin && (
          <span className="badge badge-info">نمایش فقط دانشجویان دوره‌های شما</span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8 }} />)}
        </div>
      ) : error ? (
        <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{error}</h3></div>
      ) : isStudent ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">سوابق دوره‌ها ({list.length})</span>
            {list[0]?.GPA != null && (
              <span className="badge badge-info" style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'center' }}>میانگین کل (GPA): {list[0].GPA}</span>
            )}
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>دوره</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th>نمره نهایی</th><th>عملیات</th></tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">📜</div><h3>سابقه‌ای یافت نشد</h3></div></td></tr>
                ) : list.map((r: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.CourseTitle}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{r.EnrollmentDate ? new Date(r.EnrollmentDate).toLocaleDateString('fa-IR') : '—'}</td>
                    <td>
                      <span className={`badge ${r.EnrollmentStatus === 'Successful' ? 'badge-success' : r.EnrollmentStatus === 'Pending' ? 'badge-warning' : r.EnrollmentStatus === 'Dropped' ? 'badge-neutral' : 'badge-danger'}`}>
                        {r.EnrollmentStatus}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', direction: 'ltr' , textAlign: 'right'}}>
                      {r.FinalScore != null ? <strong style={{ color: r.FinalScore >= 10 ? 'var(--color-success)' : 'var(--color-danger)' }}>{r.FinalScore}/20</strong> : '—'}
                    </td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => onOpenCourse(r.CourseID)}>مشاهده دوره</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {Object.keys(grouped).length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📜</div><h3>سابقه‌ای یافت نشد</h3></div>
          ) : Object.entries(grouped).map(([key, rows]) => {
            const [, fullName] = key.split('::');
            const gpa = rows[0]?.GPA;
            return (
              <div key={key} className="card">
                <div className="card-header">
                  <span className="card-title">{fullName}</span>
                  {gpa != null && <span className="badge badge-info" style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'center'}}>GPA: {gpa}</span>}
                </div>
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead><tr><th>دوره</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th>نمره نهایی</th><th>عملیات</th></tr></thead>
                    <tbody>
                      {rows.map((r: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{r.CourseTitle}</td>
                          <td style={{ fontSize: 'var(--text-xs)' }}>{r.EnrollmentDate ? new Date(r.EnrollmentDate).toLocaleDateString('fa-IR') : '—'}</td>
                          <td>
                            <span className={`badge ${r.EnrollmentStatus === 'Successful' ? 'badge-success' : r.EnrollmentStatus === 'Pending' ? 'badge-warning' : r.EnrollmentStatus === 'Dropped' ? 'badge-neutral' : 'badge-danger'}`}>
                              {r.EnrollmentStatus}
                            </span>
                           </td>
                          <td style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'center' }}>{r.FinalScore != null ? `${r.FinalScore}/۲۰` : '—'}</td>
                          <td><button className="btn btn-secondary btn-sm" onClick={() => onOpenCourse(r.CourseID)}>مشاهده دوره</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}