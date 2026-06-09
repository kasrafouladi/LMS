import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { userRoleBadge } from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { listUsers, updateUserStatus } from '../api/users';
import { ApiError } from '../api/client';

function Skeleton() {
  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
    </div>
  );
}

export default function Users() {
  const { isAdmin } = useAuth();
  const [roleFilter, setRoleFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [statusModal, setStatusModal] = useState<{ userId: number; name: string } | null>(null);
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);

  const { data: users, loading, error, refetch } = useApi(
    () => listUsers(roleFilter || undefined, includeDeleted),
    [roleFilter, includeDeleted]
  );

  async function handleUpdateStatus() {
    if (!statusModal) return;
    setSaving(true);
    try {
      await updateUserStatus(statusModal.userId, { student_status: newStatus });
      setStatusModal(null);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDelete(userId: number) {
    if (!confirm('کاربر غیرفعال (حذف منطقی) شود؟')) return;
    try {
      await updateUserStatus(userId, { is_deleted: true });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'خطا');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">مدیریت کاربران</h1>
          <p className="page-subtitle">تمام کاربران سیستم</p>
        </div>
        <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 140 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">همه نقش‌ها</option>
            <option value="Admin">مدیر</option>
            <option value="Teacher">مدرس</option>
            <option value="Student">دانشجو</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--gray-600)', cursor: 'pointer' }}>
            <input type="checkbox" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)} />
            شامل حذف‌شده‌ها
          </label>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {loading ? 'در حال بارگذاری...' : `لیست کاربران (${users?.length ?? 0})`}
          </span>
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
                  <th>#</th><th>نام کامل</th><th>ایمیل</th><th>نقش</th>
                  <th>شماره تلفن</th><th>تاریخ ثبت‌نام</th>
                  {isAdmin && <th>عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {(users ?? []).length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">👥</div><h3>کاربری یافت نشد</h3></div></td></tr>
                ) : (users ?? []).map((u: any) => (
                  <tr key={u.UserID} style={{ opacity: u.IsDeleted ? 0.45 : 1 }}>
                    <td style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>{u.UserID}</td>
                    <td style={{ fontWeight: 600 }}>{u.FullName}</td>
                    <td style={{ color: 'var(--gray-500)', direction: 'ltr', textAlign: 'right' }}>{u.Email}</td>
                    <td>{userRoleBadge(u.Role)}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--gray-500)' }}>{u.PhoneNumber ?? '—'}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                      {u.RegistrationDate ? new Date(u.RegistrationDate).toLocaleDateString('fa-IR') : '—'}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-2">
                          {u.Role === 'Student' && !u.IsDeleted && (
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => { setStatusModal({ userId: u.UserID, name: u.FullName }); setNewStatus(u.Status === 'Active' ? 'Inactive' : 'Active'); }}>
                              وضعیت
                            </button>
                          )}
                          {!u.IsDeleted && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleSoftDelete(u.UserID)}>حذف</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!statusModal}
        title="تغییر وضعیت دانشجو"
        onClose={() => setStatusModal(null)}
        footer={<>
          <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
          <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>انصراف</button>
        </>}
      >
        <p style={{ color: 'var(--gray-600)' }}>وضعیت <strong>{statusModal?.name}</strong> به چه حالتی تغییر کند؟</p>
        <div className="form-group">
          <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value as any)}>
            <option value="Active">فعال</option>
            <option value="Inactive">غیرفعال</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
