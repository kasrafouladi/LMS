import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getSubmissionsForGrading, gradeSubmission, createAssignment, updateAssignment, deleteAssignment, getMyGrades } from '../api/users';
import { listCourses, getCourseAssignments } from '../api/courses';
import { ApiError } from '../api/client';

type Tab = 'assignments' | 'submissions';

function Skeleton() {
  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
    </div>
  );
}

function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }

export default function Assignments() {
  const { isTeacher, isAdmin, isStudent } = useAuth();
  const [tab, setTab] = useState<Tab>(isStudent ? 'assignments' : 'submissions');
  const [filterCourse, setFilterCourse] = useState<number | undefined>(undefined);

  const [gradeModal, setGradeModal] = useState<{ submissionId: number; studentName: string } | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });
  const [saving, setSaving] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [addForm, setAddForm] = useState({ course_id: 0, title: '', description: '', due_date: '', max_score: 20 });

  const { data: submissions, loading: subLoading, error: subError, refetch: refetchSubs } =
    useApi(() => (isTeacher || isAdmin) ? getSubmissionsForGrading({ course_id: filterCourse }) : Promise.resolve([]), [filterCourse, isTeacher, isAdmin]);

  const { data: courses } = useApi(() => listCourses({ teacher_id: undefined }), []);

  // For teacher: assignments per selected course
  const { data: courseAssignments, loading: caLoading, refetch: refetchAssignments } = useApi(
    () => (filterCourse && (isTeacher || isAdmin)) ? getCourseAssignments(filterCourse) : Promise.resolve([]),
    [filterCourse, isTeacher, isAdmin]
  );

  // For student: my grades (courses + assignments)
  const { data: myGrades, loading: gradesLoading } = useApi(
    () => isStudent ? getMyGrades() : Promise.resolve({ courses: [], assignments: [] }), [isStudent]
  );

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

  function openAddAssignment() {
    setEditingAssignment(null);
    setAddForm({ course_id: filterCourse ?? 0, title: '', description: '', due_date: '', max_score: 20 });
    setAddModal(true);
  }

  function openEditAssignment(a: any) {
    setEditingAssignment(a);
    setAddForm({
      course_id: filterCourse ?? 0,
      title: a.Title,
      description: a.Description ?? '',
      due_date: a.DueDate ? new Date(a.DueDate).toISOString().slice(0, 16) : '',
      max_score: a.MaxScore,
    });
    setAddModal(true);
  }

  async function handleSaveAssignment() {
    if (!addForm.title || !addForm.course_id) return;
    setSaving(true);
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.AssignmentID, {
          title: addForm.title,
          description: addForm.description || undefined,
          due_date: addForm.due_date ? new Date(addForm.due_date).toISOString() : undefined,
          max_score: addForm.max_score,
        });
      } else {
        await createAssignment({
          course_id: addForm.course_id,
          title: addForm.title,
          description: addForm.description || undefined,
          due_date: new Date(addForm.due_date).toISOString(),
          max_score: addForm.max_score,
        });
      }
      setAddModal(false);
      refetchAssignments();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setSaving(false); }
  }

  async function handleDeleteAssignment(id: number) {
    if (!confirm('این تکلیف حذف شود؟ (در صورت وجود ارسالی، نمرات نهایی دوباره محاسبه می‌شوند)')) return;
    try {
      await deleteAssignment(id);
      refetchAssignments();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    }
  }

  const subs = (submissions as any[]) ?? [];
  const courseList = (courses as any[]) ?? [];
  const assignList = (courseAssignments as any[]) ?? [];
  const grades = (myGrades as any) ?? { courses: [], assignments: [] };

  // ── Student view ────────────────────────────────────────────────────────
  if (isStudent) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">تکالیف و نمرات</h1>
            <p className="page-subtitle">وضعیت تکالیف ارسالی و نمرات دوره‌های شما</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header">
            <span className="card-title">نمرات دوره‌ها</span>
          </div>
          {gradesLoading ? <Skeleton /> : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>دوره</th><th>نمره نهایی</th><th>وضعیت</th></tr></thead>
                <tbody>
                  {(grades.courses ?? []).length === 0 ? (
                    <tr><td colSpan={3}><div className="empty-state"><div className="empty-icon">📚</div><h3>دوره‌ای یافت نشد</h3></div></td></tr>
                  ) : grades.courses.map((c: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.CourseTitle}</td>
                      <td>{c.FinalScore != null ? <strong style={{ color: c.FinalScore >= 10 ? 'var(--color-success)' : 'var(--color-danger)' }}>{c.FinalScore}/۲۰</strong> : '—'}</td>
                      <td><span className="badge badge-info">{c.EnrollmentStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">تکالیف ارسال شده</span>
          </div>
          {gradesLoading ? <Skeleton /> : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead><tr><th>تکلیف</th><th>دوره</th><th>تاریخ ارسال</th><th>نمره</th><th>بازخورد</th></tr></thead>
                <tbody>
                  {(grades.assignments ?? []).length === 0 ? (
                    <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">📝</div><h3>تکلیفی ارسال نشده</h3></div></td></tr>
                  ) : grades.assignments.map((a: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{a.AssignmentTitle}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{a.CourseTitle}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(a.SubmissionDate)}</td>
                      <td>{a.Score != null ? <strong>{a.Score}/۲۰</strong> : <span className="badge badge-warning">تصحیح نشده</span>}</td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>{a.Feedback ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
          برای ارسال تکلیف جدید، به صفحه «دوره‌ها» بروید، روی دوره مورد نظر کلیک کنید و از تب تکالیف، گزینه «ارسال تکلیف» را انتخاب کنید.
        </p>
      </div>
    );
  }

  // ── Teacher/Admin view ──────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">تکالیف</h1>
          <p className="page-subtitle">مدیریت تکالیف و نمره‌دهی ارسال‌های دانشجویان</p>
        </div>
        <div className="flex gap-3 items-center">
          <select className="form-select" style={{ width: 220 }} value={filterCourse ?? ''} onChange={e => setFilterCourse(e.target.value ? +e.target.value : undefined)}>
            <option value="">همه دوره‌ها</option>
            {courseList.map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
          </select>
          {isTeacher && filterCourse && (
            <button className="btn btn-primary" onClick={openAddAssignment}>+ تکلیف جدید</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {(['submissions', 'assignments'] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t === 'assignments' ? '📝 لیست تکالیف' : '📤 ارسال‌ها برای نمره‌دهی'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {tab === 'submissions'
              ? (subLoading ? 'در حال بارگذاری...' : `ارسال‌ها (${subs.length})`)
              : (caLoading ? 'در حال بارگذاری...' : `تکالیف دوره (${assignList.length})`)}
          </span>
        </div>

        {tab === 'submissions' && (
          subLoading ? <Skeleton /> : subError ? (
            <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{subError}</h3></div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr><th>دانشجو</th><th>تکلیف</th><th>دوره</th><th>تاریخ ارسال</th><th>مهلت</th><th>فایل</th><th>نمره</th><th>بازخورد</th><th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.length === 0 ? (
                    <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">📤</div><h3>ارسالی وجود ندارد</h3></div></td></tr>
                  ) : subs.map((s: any, i: number) => (
                    <tr key={s.SubmissionID ?? i}>
                      <td style={{ fontWeight: 600 }}>{s.StudentName ?? s.StudentID}</td>
                      <td style={{ color: 'var(--gray-600)' }}>{s.AssignmentTitle ?? s.AssignmentID}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{s.CourseTitle ?? '—'}</td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                        {fmtDate(s.SubmissionDate)}
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{fmtDate(s.DueDate)}</td>
                      <td>
                        {s.FileURL ? <a href={s.FileURL} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)' }}>مشاهده فایل</a> : '—'}
                      </td>
                      <td>
                        {s.Score != null
                          ? <strong style={{ color: s.Score >= 10 ? 'var(--color-success)' : 'var(--color-danger)' }}>{s.Score}/{s.MaxScore}</strong>
                          : <span className="badge badge-warning">تصحیح نشده</span>}
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>{s.Feedback ?? '—'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { setGradeModal({ submissionId: s.SubmissionID, studentName: s.StudentName }); setGradeForm({ score: s.Score ?? 0, feedback: s.Feedback ?? '' }); }}>
                          نمره‌دهی
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'assignments' && (
          !filterCourse ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-icon">📝</div>
              <h3>یک دوره را انتخاب کنید</h3>
              <p style={{ color: 'var(--gray-400)', marginTop: 4 }}>برای مشاهده و مدیریت تکالیف، ابتدا یک دوره از فیلتر بالا انتخاب کنید</p>
            </div>
          ) : caLoading ? <Skeleton /> : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr><th>عنوان</th><th>توضیحات</th><th>مهلت</th><th>حداکثر نمره</th><th>تعداد ارسال</th>{isTeacher && <th>عملیات</th>}</tr>
                </thead>
                <tbody>
                  {assignList.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📝</div><h3>تکلیفی ثبت نشده</h3></div></td></tr>
                  ) : assignList.map((a: any) => (
                    <tr key={a.AssignmentID}>
                      <td style={{ fontWeight: 600 }}>{a.Title}</td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>{a.Description ?? '—'}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(a.DueDate)}</td>
                      <td>{a.MaxScore}</td>
                      <td>{a.SubmissionCount ?? 0}</td>
                      {isTeacher && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditAssignment(a)}>ویرایش</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAssignment(a.AssignmentID)}>حذف</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
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

      {/* Add/Edit Assignment Modal */}
      <Modal open={addModal} title={editingAssignment ? 'ویرایش تکلیف' : 'تکلیف جدید'} onClose={() => setAddModal(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleSaveAssignment} disabled={saving}>{saving ? 'ذخیره...' : editingAssignment ? 'ذخیره' : 'افزودن'}</button>
          <button className="btn btn-secondary" onClick={() => setAddModal(false)}>انصراف</button>
        </>}>
        {!editingAssignment && (
          <div className="form-group">
            <label className="form-label">دوره *</label>
            <select className="form-select" value={addForm.course_id} onChange={e => setAddForm(f => ({ ...f, course_id: +e.target.value }))}>
              <option value={0}>انتخاب کنید...</option>
              {courseList.map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">عنوان تکلیف *</label>
          <input className="form-input" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">توضیحات</label>
          <input className="form-input" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
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