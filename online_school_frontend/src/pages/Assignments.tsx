import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getSubmissionsForGrading, gradeSubmission, createAssignment } from '../api/index';
import { listCourses } from '../api/courses';
import { ApiError } from '../api/client';

type Tab = 'assignments' | 'submissions';

function Skeleton() {
  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
    </div>
  );
}

export default function Assignments() {
  const { isTeacher, isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>('assignments');
  const [gradeModal, setGradeModal] = useState<{ submissionId: number; studentName: string } | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });
  const [saving, setSaving] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ course_id: 0, title: '', due_date: '', max_score: 20 });

  const { data: submissions, loading: subLoading, error: subError, refetch: refetchSubs } =
    useApi(() => getSubmissionsForGrading({}), []);

  const { data: courses } = useApi(() => listCourses(), []);

  async function handleGrade() {
    if (!gradeModal) return;
    setSaving(true);
    try {
      await gradeSubmission({ submission_id: gradeModal.submissionId, score: gradeForm.score, feedback: gradeForm.feedback || undefined });
      setGradeModal(null);
      refetchSubs();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setSaving(false); }
  }

  async function handleAddAssignment() {
    if (!addForm.title || !addForm.course_id) return;
    setSaving(true);
    try {
      await createAssignment({ ...addForm, due_date: new Date(addForm.due_date).toISOString() });
      setAddModal(false);
      setAddForm({ course_id: 0, title: '', due_date: '', max_score: 20 });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setSaving(false); }
  }

  const subs = (submissions as any[]) ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">تکالیف</h1>
          <p className="page-subtitle">مدیریت تکالیف و ارسال‌های دانشجویان</p>
        </div>
        {(isTeacher || isAdmin) && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ تکلیف جدید</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {(['assignments', 'submissions'] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t === 'assignments' ? '📝 تکالیف' : '📤 ارسال‌ها'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {tab === 'submissions'
              ? (subLoading ? 'در حال بارگذاری...' : `ارسال‌ها (${subs.length})`)
              : 'تکالیف دوره‌ها'}
          </span>
        </div>

        {tab === 'submissions' && (
          subLoading ? <Skeleton /> : subError ? (
            <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{subError}</h3></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr><th>دانشجو</th><th>تکلیف</th><th>دوره</th><th>تاریخ</th><th>نمره</th><th>بازخورد</th>
                    {(isTeacher||isAdmin) && <th>عملیات</th>}
                  </tr>
                </thead>
                <tbody>
                  {subs.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📤</div><h3>ارسالی وجود ندارد</h3></div></td></tr>
                  ) : subs.map((s: any, i: number) => (
                    <tr key={s.SubmissionID ?? i}>
                      <td style={{ fontWeight: 600 }}>{s.StudentName ?? s.StudentID}</td>
                      <td style={{ color: 'var(--gray-600)' }}>{s.AssignmentTitle ?? s.AssignmentID}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{s.CourseTitle ?? '—'}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                        {s.SubmissionDate ? new Date(s.SubmissionDate).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td>
                        {s.Score != null
                          ? <strong style={{ color: s.Score >= 10 ? 'var(--color-success)' : 'var(--color-danger)' }}>{s.Score}/۲۰</strong>
                          : <span className="badge badge-warning">تصحیح نشده</span>}
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>{s.Feedback ?? '—'}</td>
                      {(isTeacher||isAdmin) && (
                        <td>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => { setGradeModal({ submissionId: s.SubmissionID, studentName: s.StudentName }); setGradeForm({ score: s.Score ?? 0, feedback: s.Feedback ?? '' }); }}>
                            نمره‌دهی
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'assignments' && (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <div className="empty-icon">📝</div>
            <h3>لیست تکالیف</h3>
            <p style={{ color: 'var(--gray-400)', marginTop: 4 }}>تکالیف از صفحه جزئیات دوره قابل مشاهده‌اند</p>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      <Modal open={!!gradeModal} title={`نمره‌دهی — ${gradeModal?.studentName}`} onClose={() => setGradeModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleGrade} disabled={saving}>{saving ? 'ذخیره...' : 'ثبت نمره'}</button>
          <button className="btn btn-secondary" onClick={() => setGradeModal(null)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">نمره (۰–۲۰)</label>
          <input className="form-input" type="number" min={0} max={20} step={0.5}
            value={gradeForm.score} onChange={e => setGradeForm(f => ({ ...f, score: +e.target.value }))} dir="ltr" />
        </div>
        <div className="form-group">
          <label className="form-label">بازخورد</label>
          <input className="form-input" value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} />
        </div>
      </Modal>

      {/* Add Assignment Modal */}
      <Modal open={addModal} title="تکلیف جدید" onClose={() => setAddModal(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleAddAssignment} disabled={saving}>{saving ? 'ذخیره...' : 'افزودن'}</button>
          <button className="btn btn-secondary" onClick={() => setAddModal(false)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">دوره *</label>
          <select className="form-select" value={addForm.course_id} onChange={e => setAddForm(f => ({ ...f, course_id: +e.target.value }))}>
            <option value={0}>انتخاب کنید...</option>
            {(courses ?? []).map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">عنوان تکلیف *</label>
          <input className="form-input" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">مهلت ارسال</label>
            <input className="form-input" type="datetime-local" value={addForm.due_date} onChange={e => setAddForm(f => ({ ...f, due_date: e.target.value }))} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">حداکثر نمره</label>
            <input className="form-input" type="number" min={1} max={20} value={addForm.max_score} onChange={e => setAddForm(f => ({ ...f, max_score: +e.target.value }))} dir="ltr" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
