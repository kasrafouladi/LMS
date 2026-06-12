import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { listUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { getStudentTranscript } from '../api/index';
import Modal from '../components/ui/Modal';

function Skeleton() {
  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
    </div>
  );
}

function gpaColor(gpa: number) {
  if (gpa >= 17) return 'var(--color-success)';
  if (gpa >= 12) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }

export function StudentsPage() {
  const { data, loading, error, refetch } = useApi(() => listUsers('Student'), []);
  const list = (data as any[]) ?? [];

  const [detailStudent, setDetailStudent] = useState<{ id: number; name: string } | null>(null);
  const { data: allTranscripts, loading: transLoading } = useApi(() => getStudentTranscript(), []);
  const studentRows = ((allTranscripts as any[]) ?? []).filter((r: any) => r.StudentID === detailStudent?.id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">دانشجویان</h1>
          <p className="page-subtitle">اطلاعات تخصصی دانشجویان سیستم</p>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{loading ? 'در حال بارگذاری...' : `لیست دانشجویان (${list.length})`}</span>
        </div>
        {loading ? <Skeleton /> : error ? (
          <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{error}</h3>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={refetch}>تلاش مجدد</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>نام</th><th>ایمیل</th><th>تلفن</th><th>GPA</th><th>وضعیت</th><th>عملیات</th></tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🎓</div><h3>دانشجویی یافت نشد</h3></div></td></tr>
                ) : list.map((s: any) => (
                  <tr key={s.UserID}>
                    <td style={{ fontWeight: 600 }}>{s.FullName}</td>
                    <td style={{ color: 'var(--gray-500)', direction: 'ltr', textAlign: 'right' }}>{s.Email}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--gray-500)' }}>{s.PhoneNumber ?? '—'}</td>
                    <td>
                      {s.GPA != null
                        ? <strong style={{ color: gpaColor(s.GPA) }}>{s.GPA}/۲۰</strong>
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${s.StudentStatus === 'Active' || s.Status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                        {s.StudentStatus === 'Active' || s.Status === 'Active' ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDetailStudent({ id: s.UserID, name: s.FullName })}>کارنامه</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!detailStudent} title={`کارنامه — ${detailStudent?.name}`} onClose={() => setDetailStudent(null)} maxWidth={700}>
        {transLoading ? <Skeleton /> : studentRows.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📜</div><h3>سابقه‌ای یافت نشد</h3></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>دوره</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th>نمره نهایی</th></tr></thead>
              <tbody>
                {studentRows.map((r: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.CourseTitle}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(r.EnrollmentDate)}</td>
                    <td>
                      <span className={`badge ${r.EnrollmentStatus === 'Successful' ? 'badge-success' : r.EnrollmentStatus === 'Pending' ? 'badge-warning' : 'badge-neutral'}`}>
                        {r.EnrollmentStatus}
                      </span>
                    </td>
                    <td>{r.FinalScore != null ? `${r.FinalScore}/۲۰` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function TeachersPage() {
  const { data, loading, error, refetch } = useApi(() => listUsers('Teacher'), []);
  const list = (data as any[]) ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">مدرسان</h1>
          <p className="page-subtitle">اطلاعات حرفه‌ای مدرسان</p>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">{loading ? 'در حال بارگذاری...' : `لیست مدرسان (${list.length})`}</span>
        </div>
        {loading ? <Skeleton /> : error ? (
          <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{error}</h3>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={refetch}>تلاش مجدد</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr><th>نام</th><th>ایمیل</th><th>تلفن</th><th>تخصص</th><th>درآمد کل</th></tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">👨‍🏫</div><h3>مدرسی یافت نشد</h3></div></td></tr>
                ) : list.map((t: any) => (
                  <tr key={t.UserID}>
                    <td style={{ fontWeight: 600 }}>{t.FullName}</td>
                    <td style={{ color: 'var(--gray-500)', direction: 'ltr', textAlign: 'right' }}>{t.Email}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--gray-500)' }}>{t.PhoneNumber ?? '—'}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{t.Expertise ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                      {t.TotalIncome != null ? t.TotalIncome.toLocaleString('fa-IR') + ' ت' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}