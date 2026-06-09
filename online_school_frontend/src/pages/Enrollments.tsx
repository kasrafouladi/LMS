import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { enrollmentBadge } from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { enrollStudent } from '../api/index';
import { listCourses } from '../api/courses';
import { ApiError } from '../api/client';

export default function Enrollments() {
  const { user, isStudent } = useAuth();
  const [enrollModal, setEnrollModal] = useState(false);
  const [form, setForm] = useState({ course_id: 0, amount: 0, transaction_id: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: courses, loading: cLoad } = useApi(() => listCourses(), []);

  function handleCourseSelect(courseId: number) {
    const course = (courses as any[])?.find(c => c.CourseID === courseId);
    setForm(f => ({ ...f, course_id: courseId, amount: course?.Price ?? 0 }));
  }

  async function handleEnroll() {
    if (!form.course_id || !user) return;
    setSaving(true); setSaveError(null);
    try {
      await enrollStudent({
        student_id: parseInt(user.sub),
        course_id: form.course_id,
        amount: form.amount,
        transaction_id: form.transaction_id || undefined,
      });
      setEnrollModal(false);
      setSuccessMsg('ثبت‌نام با موفقیت انجام شد! ✅');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'خطا در ثبت‌نام');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ثبت‌نام</h1>
          <p className="page-subtitle">ثبت‌نام در دوره‌های آموزشی</p>
        </div>
        {isStudent && (
          <button className="btn btn-primary" onClick={() => { setEnrollModal(true); setSaveError(null); }}>
            + ثبت‌نام در دوره
          </button>
        )}
      </div>

      {successMsg && (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-success-bg)', border: '1px solid #a7f3d0', color: '#065f46' }}>
          {successMsg}
        </div>
      )}

      {/* Available courses list */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {cLoad ? 'در حال بارگذاری...' : `دوره‌های موجود (${(courses as any[])?.length ?? 0})`}
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
                <tr><th>عنوان</th><th>مدرس</th><th>قیمت</th><th>ظرفیت</th><th>وضعیت</th>
                  {isStudent && <th>عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {((courses as any[]) ?? []).length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📚</div><h3>دوره‌ای موجود نیست</h3></div></td></tr>
                ) : ((courses as any[]) ?? []).map((c: any) => (
                  <tr key={c.CourseID}>
                    <td style={{ fontWeight: 600 }}>{c.Title}</td>
                    <td>{c.TeacherName ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{(c.Price ?? 0).toLocaleString('fa-IR')} ت</td>
                    <td style={{ color: 'var(--gray-500)' }}>{c.EnrolledCount ?? 0}/{c.Capacity}</td>
                    <td>
                      <span className={`badge ${c.Status === 'Active' ? 'badge-success' : c.Status === 'Upcoming' ? 'badge-info' : 'badge-neutral'}`}>
                        {c.Status ?? '—'}
                      </span>
                    </td>
                    {isStudent && (
                      <td>
                        <button className="btn btn-primary btn-sm"
                          onClick={() => { handleCourseSelect(c.CourseID); setEnrollModal(true); setSaveError(null); }}>
                          ثبت‌نام
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={enrollModal} title="ثبت‌نام در دوره" onClose={() => setEnrollModal(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleEnroll} disabled={saving || !form.course_id}>
            {saving ? 'در حال ثبت...' : 'تأیید و پرداخت'}
          </button>
          <button className="btn btn-secondary" onClick={() => setEnrollModal(false)}>انصراف</button>
        </>}>
        {saveError && <div className="login-error">{saveError}</div>}
        <div className="form-group">
          <label className="form-label">دوره *</label>
          <select className="form-select" value={form.course_id}
            onChange={e => handleCourseSelect(+e.target.value)}>
            <option value={0}>انتخاب کنید...</option>
            {((courses as any[]) ?? []).map((c: any) => (
              <option key={c.CourseID} value={c.CourseID}>{c.Title} — {(c.Price ?? 0).toLocaleString('fa-IR')} ت</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">مبلغ (تومان)</label>
          <input className="form-input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} dir="ltr" />
        </div>
        <div className="form-group">
          <label className="form-label">کد تراکنش (اختیاری)</label>
          <input className="form-input" value={form.transaction_id} onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))} dir="ltr" placeholder="TXN-..." />
        </div>
      </Modal>
    </div>
  );
}
