import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getStudentCertificates, issueCertificates } from '../api/index';
import { listCourses } from '../api/courses';
import { useState } from 'react';
import { ApiError } from '../api/client';

export default function Certificates() {
  const { isAdmin, isTeacher, isStudent } = useAuth();
  const { data: certs, loading, error, refetch } = useApi(() => getStudentCertificates(), []);
  const { data: courses } = useApi(() => listCourses({ status: 'Completed' }), []);
  const [selectedCourse, setSelectedCourse] = useState(0);
  const [issuing, setIssuing] = useState(false);
  const [issueMsg, setIssueMsg] = useState<string | null>(null);

  const list = (certs as any[]) ?? [];

  async function handleIssue() {
    if (!confirm(`گواهی برای ${selectedCourse ? 'دوره انتخاب‌شده' : 'همه دوره‌های واجد شرایط'} صادر شود؟`)) return;
    setIssuing(true);
    setIssueMsg(null);
    try {
      const res: any = await issueCertificates(selectedCourse || undefined);
      const issued = res?.data?.[0]?.CertificatesIssued ?? 0;
      setIssueMsg(`${issued} گواهی صادر شد.`);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setIssuing(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">گواهی‌نامه‌ها</h1>
          <p className="page-subtitle">
            {isStudent ? 'گواهی‌های پایان دوره شما' : 'صدور و مشاهده گواهی‌نامه پایان دوره'}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <div className="flex gap-3 items-center">
            <select className="form-select" style={{ width: 220 }} value={selectedCourse} onChange={e => setSelectedCourse(+e.target.value)}>
              <option value={0}>همه دوره‌های تکمیل‌شده</option>
              {(courses ?? []).map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleIssue} disabled={issuing}>
              {issuing ? '🏆 در حال صدور...' : '🏆 صدور گواهی'}
            </button>
          </div>
        )}
      </div>

      {issueMsg && (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-success-bg)', border: '1px solid #a7f3d0', color: '#065f46' }}>
          ✅ {issueMsg}
        </div>
      )}

      {/* Card grid */}
      {!loading && list.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          {list.slice(0, 6).map((c: any, i: number) => (
            <div key={c.CertificateID ?? i} className="card" style={{ padding: 'var(--space-5)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'var(--accent-amber-bg)', opacity: 0.6 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🏆</div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{c.CourseTitle ?? c.CourseID}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>
                  دانشجو: <strong style={{ color: 'var(--gray-800)' }}>{c.StudentName ?? c.StudentID}</strong>
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', direction: 'ltr' }}>{c.CertificateCode}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                    {c.IssueDate ? new Date(c.IssueDate).toLocaleDateString('fa-IR') : '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {loading ? 'در حال بارگذاری...' : `جدول گواهی‌ها (${list.length})`}
          </span>
        </div>
        {loading ? (
          <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : error ? (
          <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{error}</h3></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead><tr>{!isStudent && <th>دانشجو</th>}<th>دوره</th><th>تاریخ صدور</th><th>کد گواهی</th></tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={isStudent ? 3 : 4}><div className="empty-state"><div className="empty-icon">🏆</div><h3>گواهی‌ای صادر نشده</h3></div></td></tr>
                ) : list.map((c: any, i: number) => (
                  <tr key={c.CertificateID ?? i}>
                    {!isStudent && <td style={{ fontWeight: 600 }}>{c.StudentName ?? c.StudentID}</td>}
                    <td style={{ color: 'var(--gray-600)' }}>{c.CourseTitle ?? c.CourseID}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                      {c.IssueDate ? new Date(c.IssueDate).toLocaleDateString('fa-IR') : '—'}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', direction: 'ltr', textAlign: 'right', color: 'var(--brand-600)' }}>
                      {c.CertificateCode}
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