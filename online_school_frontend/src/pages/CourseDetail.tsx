import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { getCourseDetails, getCourseAssignments } from '../api/courses';
import { getCourseAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, submitAssignment, gradeSubmission, enrollStudent, recordAttendance } from '../api/index';
import { getStudentTranscript } from '../api/index';
import { createAssignment, updateAssignment, deleteAssignment } from '../api/index'; // اضافه شد
import Modal from '../components/ui/Modal';
import { ApiError } from '../api/client';

interface Props {
  courseId: number;
  onBack: () => void;
}

function formatPrice(n: number) { return (n ?? 0).toLocaleString('fa-IR') + ' ت'; }
function fmtDate(d?: string | null) { return d ? new Date(d).toLocaleDateString('fa-IR') : '—'; }
function fmtDateTime(d?: string | null) { return d ? new Date(d).toLocaleString('fa-IR') : '—'; }

export default function CourseDetail({ courseId, onBack }: Props) {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const { data, loading, error, refetch } = useApi(() => getCourseDetails(courseId), [courseId]);
  const { data: announcements, refetch: refetchAnn } = useApi(() => getCourseAnnouncements(courseId).catch(() => []), [courseId]);
  
  // برای دانشجو: دریافت لیست دوره‌های ثبت‌نام شده (برای تشخیص وضعیت ثبت‌نام)
  const { data: transcript } = useApi(() => isStudent ? getStudentTranscript() : Promise.resolve([]), [isStudent]);
  
  // برای دانشجو: دریافت تکالیف با وضعیت ارسال
  const { data: studentAssignments, refetch: refetchAssignments } = useApi(
    () => isStudent ? getCourseAssignments(courseId) : Promise.resolve([]),
    [courseId, isStudent]
  );

  const course = (data as any)?.course;
  const rawAssignments = (data as any)?.assignments ?? [];
  const students = (data as any)?.students ?? [];
  const annList = (announcements as any[]) ?? [];

  // استفاده از داده اختصاصی دانشجو اگر لاگین کرده باشد
  const assignments = isStudent ? (studentAssignments as any[]) ?? [] : rawAssignments;

  const isOwner = isTeacher && course && Number(user?.sub) === course.TeacherID;
  const canManage = isAdmin || isOwner;

  // ── تشخیص وضعیت ثبت‌نام دانشجو ──────────────────────────────────────────────
  const myEnrollmentFromTranscript = isStudent && transcript
    ? (transcript as any[]).find((e: any) => e.CourseID === courseId)
    : null;
  
  const myEnrollmentFromStudents = isStudent ? null : students.find((s: any) => s.StudentID === Number(user?.sub));
  
  const myEnrollment = isStudent ? myEnrollmentFromTranscript : myEnrollmentFromStudents;
  const isEnrolledSuccessful = isStudent
    ? myEnrollmentFromTranscript?.EnrollmentStatus === 'Successful'
    : myEnrollmentFromStudents?.EnrollmentStatus === 'Successful';

  // ── Enroll modal ──────────────────────────────────────────────
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

  // ── Submit / edit / delete assignment (برای دانشجو) ─────────────────────────
  const [submitModal, setSubmitModal] = useState<{ assignmentId: number; title: string; isEdit: boolean; submissionId?: number } | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  function openSubmitModal(a: any) {
    const isEdit = a.SubmissionStatus === 'Submitted';
    setSubmitModal({
      assignmentId: a.AssignmentID,
      title: a.Title,
      isEdit,
      submissionId: a.SubmissionID
    });
    setFileUrl(a.SubmissionURL ?? '');
    setSubmitError(null);
  }

  async function handleSubmitAssignment() {
    if (!submitModal) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const res: any = await submitAssignment({ assignment_id: submitModal.assignmentId, file_url: fileUrl });
      const msg = res?.data?.[0]?.Message ?? (submitModal.isEdit ? 'ارسال شما با موفقیت به‌روزرسانی شد' : 'تکلیف با موفقیت ارسال شد');
      setSubmitSuccess(msg);
      setSubmitModal(null);
      setFileUrl('');
      refetch();
      if (isStudent) refetchAssignments();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'خطا در ارسال تکلیف');
    } finally { setSubmitting(false); }
  }

  async function handleDeleteSubmission(assignmentId: number, submissionId?: number) {
    if (!submissionId) {
      alert('شناسه ارسال وجود ندارد');
      return;
    }
    if (!confirm('آیا از حذف ارسال خود مطمئن هستید؟ این عمل قابل بازگشت نیست.')) return;
    try {
      alert('API حذف ارسال هنوز پیاده‌سازی نشده است.');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا در حذف ارسال');
    }
  }

  // ── مدیریت تکالیف برای معلم (افزودن، ویرایش، حذف) ──────────────────────────
  const [assignmentModal, setAssignmentModal] = useState<{ id?: number; title: string; description: string; due_date: string; max_score: number } | null>(null);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  function openAddAssignment() {
    setAssignmentModal({
      title: '',
      description: '',
      due_date: '',
      max_score: 20
    });
    setAssignmentError(null);
  }

  function openEditAssignment(a: any) {
    setAssignmentModal({
      id: a.AssignmentID,
      title: a.Title,
      description: a.Description ?? '',
      due_date: a.DueDate ? new Date(a.DueDate).toISOString().slice(0, 16) : '',
      max_score: a.MaxScore
    });
    setAssignmentError(null);
  }

  async function handleSaveAssignment() {
    if (!assignmentModal || !assignmentModal.title) return;
    setAssignmentSaving(true);
    setAssignmentError(null);
    try {
      if (assignmentModal.id) {
        await updateAssignment(assignmentModal.id, {
          title: assignmentModal.title,
          description: assignmentModal.description || undefined,
          due_date: assignmentModal.due_date ? new Date(assignmentModal.due_date).toISOString() : undefined,
          max_score: assignmentModal.max_score
        });
      } else {
        await createAssignment({
          course_id: courseId,
          title: assignmentModal.title,
          description: assignmentModal.description || undefined,
          due_date: new Date(assignmentModal.due_date).toISOString(),
          max_score: assignmentModal.max_score
        });
      }
      setAssignmentModal(null);
      refetch(); // برای به‌روزرسانی لیست تکالیف
    } catch (err) {
      setAssignmentError(err instanceof ApiError ? err.message : 'خطا در ذخیره تکلیف');
    } finally {
      setAssignmentSaving(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: number) {
    if (!confirm('این تکلیف حذف شود؟ (در صورت وجود ارسالی، نمرات نهایی دوباره محاسبه می‌شوند)')) return;
    try {
      await deleteAssignment(assignmentId);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    }
  }

  // ── Grade modal (برای معلم) ───────────────────────────────────────────────
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

  // ── Attendance modal ──────────────────────────────────────────
  const [attModal, setAttModal] = useState<{ studentId: number; name: string } | null>(null);
  const [attForm, setAttForm] = useState({ session_date: '', status: 'Present' as 'Present' | 'Absent' });
  const [attSaving, setAttSaving] = useState(false);
  const [attMsg, setAttMsg] = useState<string | null>(null);

  async function handleRecordAttendance() {
    if (!attModal || !course) return;
    setAttSaving(true);
    try {
      await recordAttendance({ student_id: attModal.studentId, course_id: course.CourseID, session_date: attForm.session_date, status: attForm.status });
      setAttModal(null);
      setAttMsg('حضور با موفقیت ثبت شد');
      setTimeout(() => setAttMsg(null), 4000);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setAttSaving(false); }
  }

  // ── Announcements ─────────────────────────────────────────────
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
      {submitSuccess && (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-success-bg)', border: '1px solid #a7f3d0', color: '#065f46' }}>
          ✅ {submitSuccess}
        </div>
      )}
      {attMsg && (
        <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-success-bg)', border: '1px solid #a7f3d0', color: '#065f46' }}>
          ✅ {attMsg}
        </div>
      )}

      {/* Course info card (بدون ظرفیت) */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
        <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>{course.Description || 'بدون توضیحات'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>قیمت</div>
            <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'monospace', direction: 'ltr' }}>{formatPrice(course.Price)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>تاریخ شروع</div>
            <div style={{ fontWeight: 600 }}>{fmtDate(course.StartDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>تاریخ پایان</div>
            <div style={{ fontWeight: 600 }}>{fmtDate(course.EndDate)}</div>
          </div>
        </div>

        {isStudent && !myEnrollment && course.Status === 'Upcoming' && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" onClick={() => setEnrollOpen(true)}>ثبت‌نام در این دوره</button>
          </div>
        )}
        {isStudent && myEnrollment && (
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>وضعیت ثبت‌نام شما:</span>
            <span className={`badge ${myEnrollment.EnrollmentStatus === 'Successful' ? 'badge-success' : myEnrollment.EnrollmentStatus === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
              {myEnrollment.EnrollmentStatus}
            </span>
            {myEnrollment.FinalScore != null && (
              <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace', direction: 'ltr' }}>نمره نهایی: <strong>{myEnrollment.FinalScore}/۲۰</strong></span>
            )}
            {myEnrollment.ProgressPercent != null && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontFamily: 'monospace', direction: 'ltr' }}>پیشرفت: {myEnrollment.ProgressPercent}٪</span>
            )}
          </div>
        )}
        {!isStudent && myEnrollment && (
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>وضعیت ثبت‌نام شما (در صورت ثبت‌نام):</span>
            <span className={`badge ${myEnrollment.EnrollmentStatus === 'Successful' ? 'badge-success' : 'badge-warning'}`}>
              {myEnrollment.EnrollmentStatus}
            </span>
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
          {canManage && course.Status !== 'Completed' && course.Status !== 'Cancelled' && (
            <button className="btn btn-primary btn-sm" onClick={openAddAssignment}>+ تکلیف جدید</button>
          )}
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
                  {isStudent && <th>بازخورد</th>}
                  {!isStudent && <th>تعداد ارسال</th>}
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => {
                  const deadlinePassed = a.DueDate ? new Date(a.DueDate).getTime() < Date.now() : false;
                  const isGraded = a.Score != null;
                  const submissionStatus = a.SubmissionStatus;
                  const canSubmit = isStudent && isEnrolledSuccessful && !isGraded && submissionStatus === 'Pending' && !deadlinePassed;
                  const canEdit = isStudent && isEnrolledSuccessful && !isGraded && submissionStatus === 'Submitted';
                  const canDelete = isStudent && isEnrolledSuccessful && !isGraded && submissionStatus === 'Submitted';
                  const canManageAssignment = canManage; // معلم یا ادمین
                  return (
                    <tr key={a.AssignmentID}>
                      <td style={{ fontWeight: 600 }}>{a.Title}</td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 'var(--text-xs)' }}>{a.Description ?? '—'}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{fmtDateTime(a.DueDate)}</td>
                      <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{a.MaxScore}</td>
                      {isStudent && (
                        <td>
                          <span className={`badge ${
                            submissionStatus === 'Submitted' ? 'badge-success' :
                            submissionStatus === 'Missed' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {submissionStatus === 'Submitted' ? 'ارسال شده' : submissionStatus === 'Missed' ? 'ارسال نشده (مهلت گذشته)' : 'در انتظار ارسال'}
                          </span>
                        </td>
                      )}
                      {isStudent && (
                        <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>
                          {a.Score != null ? <strong style={{ color: a.Score >= a.MaxScore/2 ? 'var(--color-success)' : 'var(--color-danger)' }}>{a.Score}/{a.MaxScore}</strong> : '—'}
                        </td>
                      )}
                      {isStudent && (
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{a.Feedback ?? '—'}</td>
                      )}
                      {!isStudent && <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{a.SubmissionCount ?? 0}<td>}
                      <td>
                        {/* عملیات برای دانشجو */}
                        {isStudent && isEnrolledSuccessful && !isGraded && (
                          <>
                            {canSubmit && (
                              <button className="btn btn-primary btn-sm" onClick={() => openSubmitModal(a)}>
                                ارسال تکلیف
                              </button>
                            )}
                            {canEdit && (
                              <button className="btn btn-secondary btn-sm" onClick={() => openSubmitModal(a)}>
                                ویرایش ارسال
                              </button>
                            )}
                            {canDelete && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubmission(a.AssignmentID, a.SubmissionID)}>
                                حذف ارسال
                              </button>
                            )}
                            {!canSubmit && !canEdit && submissionStatus === 'Pending' && deadlinePassed && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>مهلت ارسال گذشته است</span>
                            )}
                          </>
                        )}
                        {isStudent && isGraded && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>نمره‌دهی شده — قابل ویرایش نیست</span>
                        )}
                        {isStudent && submissionStatus === 'Missed' && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>مهلت ارسال گذشته است</span>
                        )}
                        {/* عملیات برای معلم/ادمین */}
                        {!isStudent && canManageAssignment && (
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditAssignment(a)}>ویرایش</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAssignment(a.AssignmentID)}>حذف</button>
                          </div>
                        )}
                        {!isStudent && !canManageAssignment && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>برای مدیریت تکلیف، باید مالک دوره باشید</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                    <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{s.FinalScore != null ? `${s.FinalScore}/۲۰` : '—'}</td>
                    <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{s.ProgressPercent}٪</td>
                    <td style={{ fontFamily: 'monospace', direction: 'ltr' }}>{s.GPA != null ? s.GPA : '—'}</td>
                    {canManage && (
                      <td>
                        {s.EnrollmentStatus === 'Successful' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => { setAttModal({ studentId: s.StudentID, name: s.FullName }); setAttForm({ session_date: '', status: 'Present' }); }}>
                            ثبت حضور
                          </button>
                        )}
                      </td>
                    )}
                  <tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال ثبت‌نام */}
      <Modal open={enrollOpen} title="ثبت‌نام در دوره" onClose={() => setEnrollOpen(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>{enrolling ? 'در حال ثبت...' : 'تأیید و پرداخت'}</button>
          <button className="btn btn-secondary" onClick={() => setEnrollOpen(false)}>انصراف</button>
        </>}>
        {enrollError && <div className="login-error">{enrollError}</div>}
        <p>مبلغ قابل پرداخت: <strong style={{ color: 'var(--accent-green)', fontFamily: 'monospace', direction: 'ltr' }}>{formatPrice(course.Price)}</strong></p>
        <div className="form-group">
          <label className="form-label">کد تراکنش (اختیاری)</label>
          <input className="form-input" value={enrollForm.transaction_id} onChange={e => setEnrollForm({ transaction_id: e.target.value })} dir="ltr" placeholder="TXN-..." />
        </div>
      </Modal>

      {/* مودال ارسال/ویرایش تکلیف برای دانشجو */}
      <Modal open={!!submitModal} title={`${submitModal?.isEdit ? 'ویرایش ارسال' : 'ارسال تکلیف'} — ${submitModal?.title}`} onClose={() => setSubmitModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleSubmitAssignment} disabled={submitting || !fileUrl}>{submitting ? 'در حال ارسال...' : (submitModal?.isEdit ? 'به‌روزرسانی' : 'ارسال')}</button>
          <button className="btn btn-secondary" onClick={() => setSubmitModal(null)}>انصراف</button>
        </>}>
        {submitError && <div className="login-error">{submitError}</div>}
        <div className="form-group">
          <label className="form-label">لینک فایل تکلیف *</label>
          <input className="form-input" value={fileUrl} onChange={e => setFileUrl(e.target.value)} dir="ltr" placeholder="https://..." />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 4 }}>
            فایل تکلیف خود را در یک سرویس اشتراک‌گذاری (مثل Google Drive، Dropbox یا هر فضای ابری دیگر) آپلود کرده و لینک عمومی آن را اینجا وارد کنید.
          </p>
        </div>
        {submitModal?.isEdit && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)' }}>
            ⚠️ توجه: تا زمانی که نمره‌دهی نشده باشد می‌توانید ارسال خود را ویرایش کنید. پس از نمره‌دهی، امکان ویرایش وجود ندارد.
          </p>
        )}
      </Modal>

      {/* مودال افزودن/ویرایش تکلیف برای معلم */}
      <Modal open={!!assignmentModal} title={assignmentModal?.id ? 'ویرایش تکلیف' : 'تکلیف جدید'} onClose={() => setAssignmentModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleSaveAssignment} disabled={assignmentSaving || !assignmentModal?.due_date || !assignmentModal?.title}>
            {assignmentSaving ? 'ذخیره...' : assignmentModal?.id ? 'ذخیره' : 'افزودن'}
          </button>
          <button className="btn btn-secondary" onClick={() => setAssignmentModal(null)}>انصراف</button>
        </>}>
        {assignmentError && <div className="login-error">{assignmentError}</div>}
        <div className="form-group">
          <label className="form-label">عنوان تکلیف *</label>
          <input className="form-input" value={assignmentModal?.title ?? ''} onChange={e => setAssignmentModal(m => m ? { ...m, title: e.target.value } : m)} />
        </div>
        <div className="form-group">
          <label className="form-label">توضیحات</label>
          <textarea className="form-input" rows={3} value={assignmentModal?.description ?? ''} onChange={e => setAssignmentModal(m => m ? { ...m, description: e.target.value } : m)} />
        </div>
        <div className="form-group">
          <label className="form-label">مهلت ارسال *</label>
          <input className="form-input" type="datetime-local" value={assignmentModal?.due_date ?? ''} onChange={e => setAssignmentModal(m => m ? { ...m, due_date: e.target.value } : m)} dir="ltr" />
        </div>
        <div className="form-group">
          <label className="form-label">حداکثر نمره</label>
          <input className="form-input" type="number" min={1} max={20} step={0.5} value={assignmentModal?.max_score ?? 20} onChange={e => setAssignmentModal(m => m ? { ...m, max_score: +e.target.value } : m)} dir="ltr" />
        </div>
      </Modal>

      {/* مودال نمره‌دهی */}
      <Modal open={!!gradeModal} title={`نمره‌دهی — ${gradeModal?.studentName}`} onClose={() => setGradeModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleGrade} disabled={grading}>{grading ? 'ذخیره...' : 'ثبت نمره'}</button>
          <button className="btn btn-secondary" onClick={() => setGradeModal(null)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">نمره (۰–۲۰)</label>
          <input className="form-input" type="number" min={0} max={20} step={0.5} dir="ltr"
            value={gradeForm.score} onChange={e => setGradeForm(f => ({ ...f, score: +e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">بازخورد</label>
          <input className="form-input" value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} />
        </div>
      </Modal>

      {/* مودال ثبت حضور */}
      <Modal open={!!attModal} title={`ثبت حضور — ${attModal?.name}`} onClose={() => setAttModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleRecordAttendance} disabled={attSaving || !attForm.session_date}>{attSaving ? 'ذخیره...' : 'ثبت'}</button>
          <button className="btn btn-secondary" onClick={() => setAttModal(null)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">تاریخ جلسه</label>
          <input className="form-input" type="date" value={attForm.session_date} onChange={e => setAttForm(f => ({ ...f, session_date: e.target.value }))} dir="ltr" />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 4 }}>
            تاریخ باید در بازه زمانی دوره ({fmtDate(course.StartDate)} تا {fmtDate(course.EndDate)}) باشد.
          </p>
        </div>
        <div className="form-group">
          <label className="form-label">وضعیت</label>
          <select className="form-select" value={attForm.status} onChange={e => setAttForm(f => ({ ...f, status: e.target.value as any }))}>
            <option value="Present">حاضر</option>
            <option value="Absent">غایب</option>
          </select>
        </div>
      </Modal>

      {/* مودال اطلاعیه */}
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