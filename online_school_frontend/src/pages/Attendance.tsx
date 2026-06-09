import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { attendanceBadge } from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { reportAttendance, recordAttendance } from '../api/index';
import { listCourses } from '../api/courses';
import { ApiError } from '../api/client';

export default function Attendance() {
  const { user, isTeacher, isAdmin } = useAuth();
  const [courseId, setCourseId] = useState<number>(0);
  const [studentId, setStudentId] = useState<number>(user ? parseInt(user.sub) : 0);
  const [searched, setSearched] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [recForm, setRecForm] = useState({ student_id: 0, course_id: 0, session_date: '', status: 'Present' as 'Present'|'Absent' });
  const [saving, setSaving] = useState(false);

  const { data: courses } = useApi(() => listCourses(), []);
  const { data: records, loading, error, refetch } = useApi(
    () => (searched && courseId && studentId) ? reportAttendance(studentId, courseId) : Promise.resolve([]),
    [searched, courseId, studentId]
  );

  async function handleRecord() {
    setSaving(true);
    try {
      await recordAttendance({ ...recForm, session_date: recForm.session_date });
      setRecordModal(false);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally { setSaving(false); }
  }

  const list = (records as any[]) ?? [];
  const presentCount = list.filter(r => r.Status === 'Present').length;
  const pct = list.length ? Math.round((presentCount / list.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">حضور و غیاب</h1>
          <p className="page-subtitle">ثبت و مشاهده حضور دانشجویان</p>
        </div>
        {(isTeacher || isAdmin) && (
          <button className="btn btn-primary" onClick={() => setRecordModal(true)}>+ ثبت حضور</button>
        )}
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">دوره</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(+e.target.value)}>
              <option value={0}>انتخاب کنید...</option>
              {(courses ?? []).map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
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
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--brand-600)' }}>{pct}٪</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>درصد حضور</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-sm)' }}>
                <span>حاضر: <strong style={{ color: 'var(--color-success)' }}>{presentCount}</strong></span>
                <span>غایب: <strong style={{ color: 'var(--color-danger)' }}>{list.length - presentCount}</strong></span>
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
                <thead><tr><th>تاریخ</th><th>وضعیت</th></tr></thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={2}><div className="empty-state"><div className="empty-icon">✅</div><h3>سابقه‌ای یافت نشد</h3></div></td></tr>
                  ) : list.map((r: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                        {r.SessionDate ? new Date(r.SessionDate).toLocaleDateString('fa-IR') : '—'}
                      </td>
                      <td>{attendanceBadge(r.Status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={recordModal} title="ثبت حضور" onClose={() => setRecordModal(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleRecord} disabled={saving}>{saving ? 'ذخیره...' : 'ثبت'}</button>
          <button className="btn btn-secondary" onClick={() => setRecordModal(false)}>انصراف</button>
        </>}>
        <div className="form-group">
          <label className="form-label">دوره</label>
          <select className="form-select" value={recForm.course_id} onChange={e => setRecForm(f => ({ ...f, course_id: +e.target.value }))}>
            <option value={0}>انتخاب...</option>
            {(courses ?? []).map((c: any) => <option key={c.CourseID} value={c.CourseID}>{c.Title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">شناسه دانشجو</label>
          <input className="form-input" type="number" value={recForm.student_id} onChange={e => setRecForm(f => ({ ...f, student_id: +e.target.value }))} dir="ltr" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">تاریخ جلسه</label>
            <input className="form-input" type="date" value={recForm.session_date} onChange={e => setRecForm(f => ({ ...f, session_date: e.target.value }))} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">وضعیت</label>
            <select className="form-select" value={recForm.status} onChange={e => setRecForm(f => ({ ...f, status: e.target.value as any }))}>
              <option value="Present">حاضر</option>
              <option value="Absent">غایب</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
