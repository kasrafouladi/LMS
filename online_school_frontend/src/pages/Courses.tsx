import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { listCourses, createCourse, updateCourse, deleteCourse, type Course } from '../api/courses';
import { ApiError } from '../api/client';

const EMPTY_FORM = {
  title: '', description: '', price: 0, capacity: 30,
  start_date: '', end_date: '',
};

function formatPrice(n: number) { return n?.toLocaleString('fa-IR') + ' ت'; }

function Skeleton() {
  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
    </div>
  );
}

export default function Courses() {
  const { isAdmin, isTeacher } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: courses, loading, error, refetch } = useApi(
    () => listCourses({ search: search || undefined }),
    [search]
  );

  function openAdd() { setEditCourse(null); setForm(EMPTY_FORM); setSaveError(null); setModalOpen(true); }
  function openEdit(c: Course) {
    setEditCourse(c);
    setForm({
      title: c.Title, description: c.Description ?? '', price: c.Price,
      capacity: c.Capacity, start_date: c.StartDate?.slice(0, 10) ?? '',
      end_date: c.EndDate?.slice(0, 10) ?? '',
    });
    setSaveError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title) return;
    setSaving(true); setSaveError(null);
    try {
      if (editCourse) {
        await updateCourse(editCourse.CourseID, form);
      } else {
        await createCourse({
          ...form,
          start_date: new Date(form.start_date).toISOString(),
          end_date: new Date(form.end_date).toISOString(),
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('دوره حذف شود؟')) return;
    try { await deleteCourse(id); refetch(); }
    catch (err) { alert(err instanceof ApiError ? err.message : 'خطا'); }
  }

  const filtered = (courses ?? []).filter(c =>
    !search || c.Title?.includes(search) || c.TeacherName?.includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">مدیریت دوره‌ها</h1>
          <p className="page-subtitle">دوره‌های آموزشی ارائه‌شده</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button className="btn btn-primary" onClick={openAdd}>+ افزودن دوره</button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {loading ? 'در حال بارگذاری...' : `لیست دوره‌ها (${filtered.length})`}
          </span>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="جستجو..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 220, paddingRight: '2.25rem' }} />
          </div>
        </div>

        {loading ? <Skeleton /> : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>خطا در بارگذاری</h3>
            <p>{error}</p>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={refetch}>تلاش مجدد</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>عنوان</th><th>مدرس</th><th>قیمت</th>
                  <th>شروع</th><th>پایان</th><th>ظرفیت</th><th>وضعیت</th>
                  {(isAdmin || isTeacher) && <th>عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">📚</div><h3>دوره‌ای یافت نشد</h3></div></td></tr>
                ) : filtered.map(c => {
                  const pct = c.EnrolledCount != null && c.Capacity
                    ? Math.round((c.EnrolledCount / c.Capacity) * 100) : 0;
                  return (
                    <tr key={c.CourseID}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.Title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 2 }}>{c.Description}</div>
                      </td>
                      <td>{c.TeacherName ?? '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatPrice(c.Price)}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{c.StartDate?.slice(0,10)}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{c.EndDate?.slice(0,10)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 5, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct > 85 ? 'var(--color-warning)' : 'var(--brand-500)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                            {c.EnrolledCount ?? 0}/{c.Capacity}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.Status === 'Active' ? 'badge-success' :
                          c.Status === 'Upcoming' ? 'badge-info' :
                          c.Status === 'Completed' ? 'badge-neutral' : 'badge-danger'
                        }`}>{c.Status ?? '—'}</span>
                      </td>
                      {(isAdmin || isTeacher) && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>ویرایش</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.CourseID)}>حذف</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editCourse ? 'ویرایش دوره' : 'افزودن دوره جدید'}
        onClose={() => setModalOpen(false)}
        footer={<>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'در حال ذخیره...' : editCourse ? 'ذخیره' : 'افزودن'}
          </button>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>انصراف</button>
        </>}
      >
        {saveError && <div className="login-error">{saveError}</div>}
        <div className="form-group">
          <label className="form-label">عنوان دوره *</label>
          <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">توضیحات</label>
          <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">قیمت (تومان)</label>
            <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">ظرفیت</label>
            <input className="form-input" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">تاریخ شروع</label>
            <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} dir="ltr" />
          </div>
          <div className="form-group">
            <label className="form-label">تاریخ پایان</label>
            <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} dir="ltr" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
