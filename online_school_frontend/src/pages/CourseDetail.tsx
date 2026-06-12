import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { getCourseDetails } from '../api/courses';
import { getCourseAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, submitAssignment, gradeSubmission, enrollStudent, recordAttendance } from '../api/index';
import Modal from '../components/ui/Modal';
import { ApiError } from '../api/client';

interface Props {
  courseId: number;
  onBack: () => void;
}

function formatPrice(n: number) { return (n ?? 0).toLocaleString('fa-IR') + ' ت'; }
function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }

export default function CourseDetail({ courseId, onBack }: Props) {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const { data, loading, error, refetch } = useApi(() => getCourseDetails(courseId), [courseId]);
  const { data: announcements, refetch: refetchAnn } = useApi(() => getCourseAnnouncements(courseId).catch(() => []), [courseId]);

  const course = (data as any)?.course;
  const assignments = (data as any)?.assignments ?? [];
  const students = (data as any)?.students ?? [];
  const annList = (announcements as any[]) ?? [];

  const isOwner = isTeacher && course && Number(user?.sub) === course.TeacherID;
  const canManage = isAdmin || isOwner;

  // ── Enroll modal (student) ──────────────────────────────────────────────
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ transaction_id: '' });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true); setEnrollError(null);
    try {
      const res: any = await enrollStudent({ course_id: course.CourseID, amount: course.Price, transaction_id: enrollForm.transaction_id || undefined });
      const msg = res?.data?.[0]?.Message ?? 'ثبت‌نام با موفقیت انجام شد';
      setEnrollSuccess(msg);
      setEnrollOpen(false);
      refetch();
    } catch (err) {
      setEnrollError(err instanceof ApiError ? err.message : 'خطا در ثبت‌نام');
    } finally { setEnrolling(false); }
  }

  // ── Submit assignment modal (student) ───────────────────────────────────
  const [submitModal, setSubmitModal] = useState<{ assignmentId: number; title: string } | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmitAssignment() {
    if (!submitModal) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await submitAssignment({ assignment_id: submitModal.assignmentId, file_url: fileUrl });
      setSubmitModal(null);
      setFileUrl('');
      refetch();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'خطا در ارسال تکلیف');
    } finally { setSubmitting(false); }
  }

  // ── Grade modal (teacher) ───────────────────────────────────────────────
  const [gradeModal, setGradeModal] = useState<{ submissionId: number; studentName?: string } | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });
  const [grading, setGrading] = useState(false);

  async function handleGrade() {
    if (!gradeModal) return;
    setGrading(true);
    try {
      await gradeSubmission({ submission_id: gradeModal.submissionId, score: gradeForm.score, feedback: gradeForm.feedback || undefined });
      setGradeModal(null);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setGrading(false); }
  }

  // ── Attendance modal (teacher/admin) ────────────────────────────────────
  const [attModal, setAttModal] = useState<{ studentId: number; name: string } | null>(null);
  const [attForm, setAttForm] = useState({ session_date: '', status: 'Present' as 'Present' | 'Absent' });
  const [attSaving, setAttSaving] = useState(false);

  async function handleRecordAttendance() {
    if (!attModal || !course) return;
    setAttSaving(true);
    try {
      await recordAttendance({ student_id: attModal.studentId, course_id: course.CourseID, session_date: attForm.session_date, status: attForm.status });
      setAttModal(null);
      alert('حضور با موفقیت ثبت شد');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setAttSaving(false); }
  }

  // ── Announcements (teacher) ─────────────────────────────────────────────
  const [annModal, setAnnModal] = useState<{ id?: number; title: string; content: string } | null>(null);
  const [annSaving, setAnnSaving] = useState(false);

  async function handleSaveAnnouncement() {
    if (!annModal) return;
    setAnnSaving(true);
    try {
      if (annModal.id) {
        await updateAnnouncement(annModal.id, { title: annModal.title, content: annModal.content });
      } else {
        await createAnnouncement(courseId, { title: annModal.title, content: annModal.content });
      }
      setAnnModal(null);
      refetchAnn();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setAnnSaving(false); }
  }

  async function handleDeleteAnnouncement(id: number) {
    if (!confirm('این اطلاعیه حذف شود؟')) return;
    try {
      await deleteAnnouncement(id);
      refetchAnn();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    }
  }

  if (loading) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-400)' }}>در حال بارگذاری...</div>;
  }
  if (error || !course) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>{error ?? 'دوره یافت نشد'}</h3>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={onBack}>بازگشت</button>
      </div>
    );
  }

  // Determine my submission/enrollment status (student)
  const myEnrollment = isStudent ? students.find((s: any) => s.StudentID === Number(user?.sub)) : null;
  const isEnrolledSuccessful = isStudent && (myEnrollment?.EnrollmentStatus === 'Successful');

  const pct = course.Capacity ? Math.round(((students.filter((s:any)=>s.EnrollmentStatus==='Successful').length) / course.Capacity) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← بازگشت به دوره‌ها</button>
          <h1 className="page-title">{course.Title}</h1>
          <p className="page-subtitle">مدرس: {course.TeacherName ?? '—'}</p>
        </div>
        <div className="flex gap-2">
          <span className={`badge ${
            course.Status === 'Active' ? 'badge-success' :
            course.Status === 'Upcoming' ? 'badge-info' :
            course.Status === 'Draft' ? 'badge-warning' :
            course.Status === 'Completed' ? 'badge-neutral' : 'badge-danger'
          }`} style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}>{course.Status}</span>
        </div>
      </div>

      {enrollSuccess && (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-success-bg)', border: '1px solid #a7f3d0', color: '#065f46' }}>
          ✅ {enrollSuccess}
        </div>
      )}

      {/* Course info card */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>{course.Description || 'بدون توضیحات'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>قیمت</div>
            <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatPrice(course.Price)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>تاریخ شروع</div>
            <div style={{ fontWeight: 600 }}>{fmtDate(course.StartDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>تاریخ پایان</div>
            <div style={{ fontWeight: 600 }}>{fmtDate(course.EndDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>ظرفیت</div>
            <div style={{ fontWeight: 600 }}>{students.filter((s:any)=>s.EnrollmentStatus==='Successful').length || 0}/{course.Capacity} ({pct}٪)</div>
          </div>
        </div>

        {isStudent && !myEnrollment && course.Status === 'Upcoming' && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" onClick={() => setEnrollOpen(true)}>ثبت‌نام در این دوره</button>
          </div>
        )}
        {isStudent && myEnrollment && (
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>وضعیت ثبت‌نام شما:</span>
            <span className={`badge ${myEnrollment.EnrollmentStatus === 'Successful' ? 'badge-success' : myEnrollment.EnrollmentStatus === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
              {myEnrollment.EnrollmentStatus}
            </span>
            {myEnrollment.FinalScore != null && (
              <span style={{ fontSize: 'var(--text-sm)' }}>نمره نهایی: <strong>{myEnrollment.FinalScore}/۲۰</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Announcements */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header">
          <span className="card-title">📢 اطلاعیه‌های دوره</span>
          {canManage && course.Status !== 'Completed' && course.Status !== 'Cancelled' && (
            <button className="btn btn-primary btn-sm" onClick={() => setAnnModal({ title: '', content: '' })}>+ اطلاعیه جدید</button>
          )}
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {annList.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}><div className="empty-icon">📢</div><h3>اطلاعیه‌ای ثبت نشده</h3></div>
          ) : annList.map((a: any) => (
            <div key={a.AnnouncementID} style={{ padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.Title}</div>
                  <div style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)', marginTop: 4 }}>{a.Content}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 6 }}>{fmtDate(a.CreatedAt)}</div>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => setAnnModal({ id: a.AnnouncementID, title: a.Title, content: a.Content })}>ویرایش</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnnouncement(a.AnnouncementID)}>حذف</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header">
          <span className="card-title">📝 تکالیف دوره ({assignments.length})</span>
        </div>
        {assignments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📝</div><h3>تکلیفی ثبت نشده</h3></div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>عنوان</th><th>توضیحات</th><th>مهلت</th><th>حداکثر نمره</th>
                  {isStudent && <th>وضعیت من</th>}
                  {isStudent && <th>نمره</th>}
                  {!isStudent && <th>تعداد ارسال</th>}
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.AssignmentID}>
                    <td style={{ fontWeight: 600 }}>{a.Title}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>{a.Description ?? '—'}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(a.DueDate)}</td>
                    <td>{a.MaxScore}</td>
                    {isStudent && (
                      <td>
                        <span className={`badge ${
                          a.SubmissionStatus === 'Submitted' ? 'badge-success' :
                          a.SubmissionStatus === 'Missed' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {a.SubmissionStatus === 'Submitted' ? 'ارسال شده' : a.SubmissionStatus === 'Missed' ? 'ارسال نشده' : 'در انتظار ارسال'}
                        </span>
                      </td>
                    )}
                    {isStudent && (
                      <td>{a.Score != null ? <strong>{a.Score}/{a.MaxScore}</strong> : '—'}</td>
                    )}
                    {!isStudent && <td>{a.SubmissionCount ?? 0}</td>}
                    <td>
                      {isStudent && isEnrolledSuccessful && a.SubmissionStatus !== 'Submitted' && a.SubmissionStatus !== 'Missed' && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setSubmitModal({ assignmentId: a.AssignmentID, title: a.Title }); setFileUrl(a.SubmissionURL ?? ''); setSubmitError(null); }}>
                          ارسال تکلیف
                        </button>
                      )}
                      {isStudent && a.SubmissionStatus === 'Submitted' && a.Score == null && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>منتظر نمره‌دهی</span>
                      )}
                      {isStudent && a.SubmissionStatus === 'Missed' && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>مهلت گذشته</span>
                      )}
                      {!isStudent && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>از تب «تکالیف» نمره‌دهی کنید</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Students list (teacher/admin only) */}
      {!isStudent && students.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🎓 دانشجویان ثبت‌نام شده ({students.length})</span>
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr><th>نام</th><th>ایمیل</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th>نمره نهایی</th><th>پیشرفت</th><th>GPA</th>
                  {canManage && <th>عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => (
                  <tr key={s.StudentID}>
                    <td style={{ fontWeight: 600 }}>{s.FullName}</td>
                    <td style={{ color: 'var(--gray-500)', direction: 'ltr', textAlign: 'right' }}>{s.Email}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDate(s.EnrollmentDate)}</td>
                    <td>
                      <span className={`badge ${s.EnrollmentStatus === 'Successful' ? 'badge-success' : s.EnrollmentStatus === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {s.EnrollmentStatus}
                      </span>
                    </td>
                    <td>{s.FinalScore != null ? `${s.FinalScore}/۲۰` : '—'}</td>
                    <td>{s.ProgressPercent}٪</td>
                    <td>{s.GPA != null ? s.GPA : '—'}</td>
                    {canManage && (
                      <td>
                        {s.EnrollmentStatus === 'Successful' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => { setAttModal({ studentId: s.StudentID, name: s.FullName }); setAttForm({ session_date: '', status: 'Present' }); }}>
                            ثبت حضور
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enroll modal */}
      <Modal open={enrollOpen} title="ثبت‌نام در دوره" onClose={() => setEnrollOpen(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>{enrolling ? 'در حال ثبت...' : 'تأیید و پرداخت'}</button>
          <button className="btn btn-secondary" onClick={() => setEnrollOpen(false)}>انصراف</button>
        </>}>
        {enrollError && <div className="login-error">{enrollError}</div>}
        <p>مبلغ قابل پرداخت: <strong style={{ color: 'var(--accent-green)' }}>{formatPrice(course.Price)}</strong></p>
        <div className="form-group">
          <label className="form-label">کد تراکنش (اختیاری)</label>
          <input className="form-input" value={enrollForm.transaction_id} onChange={e => setEnrollForm({ transaction_id: e.target.value })} dir="ltr" placeholder="TXN-..." />
        </div>
      </Modal>

      {/* Submit assignment modal */}
      <Modal open={!!submitModal} title={`ارسال تکلیف — ${submitModal?.title}`} onClose={() => setSubmitModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleSubmitAssignment} disabled={submitting || !fileUrl}>{submitting ? 'در حال ارسال...' : 'ارسال'}</button>
          <button className="btn btn-secondary" onClick={() => setSubmitModal(null)}>انصراف</button>
        </>}>
        {submitError && <div className="login-error">{submitError}</div>}
        <div className="form-group">
          <label className="form-label">لینک فایل تکلیف *</label>
          <input className="form-input" value={fileUrl} onChange={e => setFileUrl(e.target.value)} dir="ltr" placeholder="https://..." />
        </div>
      </Modal>

      {/* Attendance modal */}
      <Modal open={!!attModal} title={`ثبت حضور — ${attModal?.name}`} onClose={() => setAttModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleRecordAttendance} disabled={attSaving || !attForm.session_date}>{attSaving ? 'ذخیره...' : 'ثبت'}</button>
          <button className="btn btn-secondary" onClick={() => setAttModal(null)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">تاریخ جلسه</label>
          <input className="form-input" type="date" value={attForm.session_date} onChange={e => setAttForm(f => ({ ...f, session_date: e.target.value }))} dir="ltr" />
        </div>
        <div className="form-group">
          <label className="form-label">وضعیت</label>
          <select className="form-select" value={attForm.status} onChange={e => setAttForm(f => ({ ...f, status: e.target.value as any }))}>
            <option value="Present">حاضر</option>
            <option value="Absent">غایب</option>
          </select>
        </div>
      </Modal>

      {/* Announcement modal */}
      <Modal open={!!annModal} title={annModal?.id ? 'ویرایش اطلاعیه' : 'اطلاعیه جدید'} onClose={() => setAnnModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleSaveAnnouncement} disabled={annSaving || !annModal?.title || !annModal?.content}>{annSaving ? 'ذخیره...' : 'ذخیره'}</button>
          <button className="btn btn-secondary" onClick={() => setAnnModal(null)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">عنوان *</label>
          <input className="form-input" value={annModal?.title ?? ''} onChange={e => setAnnModal(m => m ? { ...m, title: e.target.value } : m)} />
        </div>
        <div className="form-group">
          <label className="form-label">متن *</label>
          <textarea className="form-input" rows={4} value={annModal?.content ?? ''} onChange={e => setAnnModal(m => m ? { ...m, content: e.target.value } : m)} style={{ resize: 'vertical' }} />
        </div>
      </Modal>
    </div>
  );
}